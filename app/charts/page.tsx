import type { Metadata } from "next";
import { ArrowUpRightIcon, ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr";
import { AvailabilityLegend } from "@/components/mri/availability-grid";
import {
  BarLine,
  BubbleField,
  CategoryBar,
  CountryBar,
  Dumbbell,
  FlowSankey,
  GroupedBar,
  GroupTreemap,
  InatScanArea,
  InatTaxaBar,
  MultiLine,
  RadialBars,
  RadialMeter,
  Sparkline,
  StackedBar,
  StatusDonut,
  StreamArea,
  UnitGrid,
} from "@/components/mri/charts";
import { BubbleMatrix, DotMap, FlowMap, PackedCircles, SparkArea } from "@/components/mri/figures";
import { CATEGORICAL, SERIES_NEUTRAL, SERIES_TRIO, seriesColors } from "@/lib/chart-colors";
import {
  BUBBLE_OVERALL,
  BUBBLE_POINTS,
  BUBBLE_TAGGED,
  BUBBLE_TICKS,
  COUNTRY_METHOD_ROWS,
  DOT_MAP,
  FLOW_LINKS,
  FLOW_MAP,
  FLOW_NODES,
  FLOW_TOP_PUBLISHERS,
  FLOW_TOTAL,
  GROUP_KEY,
  MATRIX_PEAKS,
  MATRIX_ROWS,
  MATRIX_TICKS,
  MATRIX_YEARS,
  METHOD_COLOR,
  METHOD_SERIES,
  METHODS,
  NAMED_SHARE,
  PACKED,
  PACKED_COUNT,
  PACKED_LEAD,
  PACKED_SIZE,
  PACKED_TOP_THREE,
  PACKED_TOTAL,
  SPARK,
  STREAM_DATA,
  STREAM_PEAK,
  TREE_BY_GROUP,
  TREE_GROUPS,
  TREE_TOTAL,
} from "@/lib/figure-fixtures";
import { PageContainer, PageHeader, SectionHeader, Specimen, SpecimenLabel } from "@/components/mri/layout";
import { ChartFrame, LegendSwatch, MetricCard, StatusBadge } from "@/components/mri/patterns";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/mri/patterns";
import { birds, inat, regionByCode } from "@/lib/data";
import { Chip } from "@/components/mri/chips";
import { formatCompact, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Charts",
  description:
    "Area, bar, line, donut, meter, unit grid and dumbbell, plus flow, treemap, stacked bar, radial bars, bubble field, streamgraph, bubble matrix, dot map, flow map and packed circles, with one hue per series.",
};

/**
 * One hue per level. Three shades of the olive ramp were the first attempt and read as
 * a single colour; teal, indigo and ochre are the validated three-way split of the
 * categorical ramp for neighbours (the blocks only ever touch in this order).
 */
const PRESENCE_LEVELS = [
  { key: "wide", label: "Six to eight countries", className: "bg-chart-cat-5" },
  { key: "some", label: "Two to five", className: "bg-chart-cat-7" },
  { key: "narrow", label: "One country or none", className: "bg-chart-cat-3" },
];

/** The platform's model comparison, measured on 589 Research Grade recordings. */
const MODEL_MATCH = [
  { key: "birdnet-v3", label: "BirdNET v3", value: 75, withPhoto: 84, soundOnly: 83 },
  { key: "perch-v2", label: "Perch v2", value: 67, withPhoto: 76, soundOnly: 79 },
  { key: "birdnet-v2.4", label: "BirdNET v2.4", value: 65, withPhoto: 73, soundOnly: 73 },
];
/** Illustrative counts for the bars-and-line specimen: records each year and their running total. */
const BAR_LINE = [120, 340, 260, 810, 2400, 1900, 3100, 950, 420].map((value, index, all) => ({
  key: String(2016 + index),
  value,
  total: all.slice(0, index + 1).reduce((sum, item) => sum + item, 0),
}));

const CHART_CONTRACT = `const config = categoricalConfig([
  { key: "newRecords", label: "New records" },
  { key: "rechecked", label: "Rechecked" },
])

<ChartContainer config={config} className="h-64 w-full">
  <AreaChart data={data}>
    <Area dataKey="newRecords" stroke={config.newRecords.color} fill="url(#new)" />
    <Area dataKey="rechecked" stroke={config.rechecked.color} fill="url(#rechecked)" />
  </AreaChart>
</ChartContainer>`;

/** `InatScanArea`'s own two series, so the key beside it cannot drift from the plot. */
const SCAN_KEY = { newRecords: CATEGORICAL[4], rechecked: CATEGORICAL[6] };

function scanLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ChartsPage() {
  const scans = inat.runs.map((run) => ({
    run: run.runId,
    label: scanLabel(run.startedAt),
    newRecords: run.newCount,
    rechecked: run.recheckedCount,
    changed: run.changedCount,
  }));

  const byCountry = birds.byCountry.map((country) => ({
    code: country.code,
    name: country.name,
    flag: country.flag,
    value: country.species,
  }));

  const taxaByCountry: ({ key: string } & Record<string, string | number>)[] =
    inat.taxaByCountry.rows.map((row) => {
      const point: { key: string } & Record<string, string | number> = {
        key: row.code,
        name: row.name,
      };
      for (const taxon of inat.taxaByCountry.taxa) point[taxon] = row[taxon] ?? 0;
      return point;
    });

  const recentYears = inat.yearByCountry.series.filter((row) => row.year >= 2000);
  const lineColors =
    inat.yearByCountry.countries.length === 3
      ? SERIES_TRIO
      : seriesColors(inat.yearByCountry.countries.length);
  const lineSeries = inat.yearByCountry.countries.map((country, index) => ({
    key: country.code,
    label: country.name,
    color: lineColors[index],
  }));
  const taxonColors =
    inat.taxaByCountry.taxa.length === 3 ? SERIES_TRIO : seriesColors(inat.taxaByCountry.taxa.length);

  const iucnDonut = birds.byIucn
    .filter((row) => row.species > 0)
    .map((row) => ({ key: row.status, label: row.status, value: row.species }));
  const iucnColors = seriesColors(iucnDonut.length);

  const taxaBars = inat.taxa.slice(0, 7).map((row) => ({
    taxon: row.taxon,
    count: row.count,
    share: row.share,
  }));

  const presence = birds.presenceDistribution.flatMap((row) =>
    Array.from({ length: row.species }, (_, index) => ({
      key: `${row.countries}-${index}`,
      level: row.countries >= 6 ? "wide" : row.countries >= 2 ? "some" : "narrow",
      label: `Found in ${row.countries} of ${birds.countries.length} countries`,
    })),
  );
  // Grouped by level, so the block reads as a proportion rather than as confetti.
  const presenceCells = PRESENCE_LEVELS.flatMap((level) =>
    presence.filter((cell) => cell.level === level.key),
  );
  const modelSeries = MODEL_MATCH.map((model, index) => ({
    key: model.key,
    label: model.label,
    color: SERIES_TRIO[index],
  }));

  const unscored = birds.featured[0];
  const sparkValues = inat.runs.map((run) => run.newCount);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Charts"
        title="Data displays, one hue per series"
        description="Every chart is a shadcn ChartContainer over Recharts. Colour tells things apart: each series, slice and level gets its own hue from the categorical ramp or a status role, with a manual legend and direct labels. Shades of one colour are never used to separate anything."
        status={
          <>
            <StatusBadge tone="positive">One hue per series</StatusBadge>
            <Chip>Recharts 3</Chip>
            <Chip>Real platform data</Chip>
          </>
        }
      />

      {/* ---------------------------------------------------------- contract */}
      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader
          eyebrow="Contract"
          title="How a chart is wired"
          description="Series colours are allocated once, by seriesColors or categoricalConfig, and each series reads its own from the config."
        />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-[0.6875rem] leading-relaxed text-foreground ring-1 ring-foreground/10">
            {CHART_CONTRACT}
          </pre>
          <div className="grid content-start gap-3">
            <SpecimenLabel
              index="1"
              title="Allocate, never hand-pick"
              description="seriesColors(n) hands out the most separated hues first. A colour chosen by eye is how two series end up looking alike."
            />
            <SpecimenLabel
              index="2"
              title="One hue per series, never shades"
              description="Two steps of one ramp are the same colour on screen. Anything a reader must tell apart gets its own hue, ordered scale or not."
            />
            <SpecimenLabel
              index="3"
              title="Legend always visible"
              description="ChartLegend is not used; a labelled row above the plot survives screenshots and print."
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader eyebrow="Time series" title="Area and line" />
        <ChartFrame
          title="Weekly scan activity (10 runs)"
          description="Records rechecked against new records per iNaturalist audit run"
          action={<Chip>Latest {inat.publishedRunId}</Chip>}
          ariaLabel="Area chart of new and rechecked records per weekly scan"
          legend={
            <>
              <LegendSwatch color={SCAN_KEY.newRecords} label="New records" />
              <LegendSwatch color={SCAN_KEY.rechecked} label="Records rechecked" />
            </>
          }
          footnote={`Source · ${inat.source}`}
        >
          <InatScanArea data={scans} className="h-64 w-full" />
        </ChartFrame>

        <ChartFrame
          title="When were the records made?"
          description="Observation year of verified country-first records, four busiest countries, 2000 onward"
          ariaLabel="Line chart of country-first records by observation year and country"
          legend={
            <>
              {lineSeries.map((series) => (
                <LegendSwatch key={series.key} color={series.color} label={series.label} />
              ))}
            </>
          }
          footnote="Observation year is distinct from the year MRI detected the record."
        >
          <MultiLine data={recentYears} series={lineSeries} className="h-64 w-full" />
        </ChartFrame>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader eyebrow="Comparison" title="Bars and grouped bars" />
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartFrame
            title="Species documented per country"
            description="East African checklist coverage"
            ariaLabel="Bar chart of documented bird species per country"
            height="h-56"
          >
            <CountryBar
              data={byCountry}
              dataKey="value"
              seriesLabel="Species"
              color={SERIES_TRIO[0]}
              className="h-56 w-full"
            />
          </ChartFrame>

          <ChartFrame
            title="Country-firsts by taxon"
            description="What kind of record each country actually added"
            ariaLabel="Grouped bar chart of country-first records by taxon and country"
            height="h-56"
            legend={
              <>
                {inat.taxaByCountry.taxa.map((taxon, index) => (
                  <LegendSwatch
                    key={taxon}
                    color={taxonColors[index]}
                    label={taxon[0].toUpperCase() + taxon.slice(1)}
                  />
                ))}
              </>
            }
          >
            <GroupedBar
              data={taxaByCountry}
              series={inat.taxaByCountry.taxa.map((taxon, index) => ({
                key: taxon,
                label: taxon,
                color: taxonColors[index],
              }))}
              className="h-56 w-full"
            />
          </ChartFrame>
        </div>

        <ChartFrame
          title="Iconic taxa in the country-first stream"
          description="Records per taxon group across the full event set"
          ariaLabel="Horizontal bar chart of country-first records per taxon group"
          height="h-64"
        >
          <InatTaxaBar data={taxaBars} className="h-64 w-full" />
        </ChartFrame>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader eyebrow="Composition" title="Donut and small multiples" />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <ChartFrame
            title="Checklist by IUCN status"
            description="All 1,706 species in the regional checklist"
            ariaLabel="Donut chart of regional checklist species by IUCN status"
            height="h-56"
            legend={
              <>
                {iucnDonut.map((row, index) => (
                  <LegendSwatch key={row.key} color={iucnColors[index]} label={row.label} />
                ))}
              </>
            }
          >
            <StatusDonut data={iucnDonut} colors={iucnColors} className="h-56 w-full" />
          </ChartFrame>

          <div className="grid content-start gap-3">
            <SpecimenLabel
              index="1"
              title="Sparkline in a metric card"
              description="Hand-rolled SVG, no chart runtime — for trend shape beside a single number"
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="New this scan"
                value={formatNumber(inat.latestRun?.newCount ?? 0)}
                detail="vs 39 last run"
                trend={
                  <span className="inline-flex items-center gap-1.5 text-[0.625rem] text-muted-foreground">
                    <Sparkline values={sparkValues} className="h-4 w-14" />
                  </span>
                }
                icon={<ChartLineUpIcon className="size-3" />}
              />
              <MetricCard
                label="Documented species"
                value={formatNumber(birds.totalSpecies)}
                detail={`${birds.familyCount} families`}
              />
              <MetricCard
                label="Audio coverage"
                value={formatCompact(birds.xeno.totals.recordings)}
                detail={`${formatNumber(birds.xeno.totals.speciesWithAudio)} species`}
              />
              <MetricCard
                label="Monitored countries"
                value={String(inat.countries.length)}
                detail={`${formatNumber(inat.eventCount)} events`}
              />
            </div>

            <SpecimenLabel
              index="2"
              title="One series, then two"
              description="A single series takes one colour. The moment there are two, each takes its own hue from seriesColors"
            />
            <div className="grid grid-cols-2 gap-3">
              <ChartFrame title="Single series" height="h-28" ariaLabel="Single-series bar chart">
                <CountryBar
                  data={byCountry}
                  dataKey="value"
                  seriesLabel="Species"
                  color="var(--primary)"
                  className="h-28 w-full"
                />
              </ChartFrame>
              <ChartFrame title="Two series" height="h-28" ariaLabel="Two-series bar chart">
                <GroupedBar
                  data={byCountry.map((row) => {
                    const source = birds.byCountry.find((c) => c.code === row.code);
                    return { key: row.code, species: row.value, withAudio: source?.withAudio ?? 0 };
                  })}
                  series={[
                    { key: "species", label: "Species", color: seriesColors(2)[0] },
                    { key: "withAudio", label: "With audio", color: seriesColors(2)[1] },
                  ]}
                  className="h-28 w-full"
                />
              </ChartFrame>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader
          eyebrow="Shares and pairs"
          title="Meters, unit grids and dumbbells"
          description="Three figures for the cases a bar chart handles badly: a share of a whole, a collection small enough to show item by item, and the same thing measured twice. None of them has an axis that can be cut to make a small gap look large."
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartFrame
            title="How often each model matched"
            description="A share is a ring, with the figure inside it"
            ariaLabel="Share of recordings matched: BirdNET v3 75%, Perch v2 67%, BirdNET v2.4 65%"
            height="h-auto"
            footnote="RadialMeter is plain SVG, so it is in the server-rendered HTML at its final size. The track is the series’ own hue, and the arc is shortened by its round caps so the painted length is the value."
          >
            <div className="flex items-start gap-2">
              {MODEL_MATCH.map((model, index) => (
                <div
                  key={model.key}
                  className="grid min-w-0 flex-1 justify-items-center gap-1.5 text-center"
                >
                  <RadialMeter value={model.value} color={SERIES_TRIO[index]} className="w-full max-w-24">
                    <span className="text-base font-medium text-foreground">{model.value}%</span>
                  </RadialMeter>
                  <p className="text-xs font-medium text-foreground">{model.label}</p>
                </div>
              ))}
            </div>
          </ChartFrame>

          <ChartFrame
            title="A photo makes no difference"
            description="The same thing measured twice, on one scale"
            ariaLabel="Share of recordings matched with and without a photo, for three models"
            height="h-auto"
            legend={
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full bg-foreground" />
                  With a photo
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-3 shrink-0 rounded-full border-2 border-foreground" />
                  Sound only
                </span>
              </>
            }
            footnote="Dumbbell keeps the whole 0–100 scale. Two marks on top of each other is the finding, and a cropped axis would turn a three-point difference into a gap."
          >
            <Dumbbell
              unit="%"
              rows={MODEL_MATCH.map((model, index) => ({
                key: model.key,
                label: model.label,
                color: SERIES_TRIO[index],
                from: model.withPhoto,
                to: model.soundOnly,
                detail: `${model.withPhoto}% with · ${model.soundOnly}% without`,
              }))}
            />
          </ChartFrame>
        </div>

        <ChartFrame
          title="How widely each species is found"
          description={`Each square is one of the ${formatNumber(birds.totalSpecies)} species on the regional checklist`}
          ariaLabel="Unit grid of checklist species by the number of countries each is found in"
          height="h-auto"
          legend={<AvailabilityLegend levels={PRESENCE_LEVELS} />}
          footnote="UnitGrid draws one cell per thing counted, ordered by level so the block reads as a proportion, with one hue per level. One tooltip serves the whole grid, and the cells are not focusable: it is a figure."
        >
          <UnitGrid cells={presenceCells} levels={PRESENCE_LEVELS} />
        </ChartFrame>

        <ChartFrame
          title="Birds recorded often are much easier"
          description="A handful of ordered categories: mark the points, label one series"
          ariaLabel="Line chart of match rate by how often a bird was recorded, for three models"
          height="h-56"
          legend={
            <>
              {modelSeries.map((series) => (
                <LegendSwatch key={series.key} color={series.color} label={series.label} />
              ))}
            </>
          }
          footnote="MultiLine with dots, a pinned 0–100 domain, a unit, and labelSeries on the series the figure is about. A number on every point of every line collides where lines meet."
        >
          <MultiLine
            data={[
              { year: "Once", "birdnet-v3": 56, "perch-v2": 44, "birdnet-v2.4": 43 },
              { year: "2 to 4 times", "birdnet-v3": 73, "perch-v2": 65, "birdnet-v2.4": 60 },
              { year: "5 times or more", "birdnet-v3": 86, "perch-v2": 80, "birdnet-v2.4": 80 },
            ]}
            series={modelSeries}
            curve="linear"
            dots
            domain={[0, 100]}
            unit="%"
            labelSeries="birdnet-v3"
            className="h-56 w-full"
          />
        </ChartFrame>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader
          eyebrow="Parts and flows"
          title="Flows, treemaps, stacked bars and rings"
          description="These forms answer where a total goes and what it is made of. A flow shows the paths, a treemap the parts, stacked bars the same parts in every row, and rings the shares of one whole. All numbers are illustrative."
        />
        <ChartFrame
          title="DNA records by country of collection, method and publisher country"
          description="FlowSankey: where a total goes, in three stages"
          ariaLabel={`Flow of ${formatNumber(FLOW_TOTAL)} DNA records from five countries to four methods to five publisher countries. ${FLOW_TOP_PUBLISHERS.map((row) => `${row.label} ${formatNumber(row.records)}`).join(", ")}.`}
          height="h-96 sm:h-[28rem]"
          legend={
            <>
              {METHOD_SERIES.map((method) => (
                <LegendSwatch key={method.key} color={method.color} label={method.label} />
              ))}
              <LegendSwatch color={SERIES_NEUTRAL} label="Country of collection" />
            </>
          }
          footnote="Read from left to right. A band’s width is its number of records. A band from a country is grey. A band from a method takes the colour of the method. The middle names are the methods. The right names are the countries of the publishers."
        >
          <FlowSankey nodes={FLOW_NODES} links={FLOW_LINKS} className="h-full" />
        </ChartFrame>

        <ChartFrame
          title="DNA records by organism group and family"
          description="GroupTreemap: what a whole is made of, in two levels"
          ariaLabel={`DNA records by organism group: ${TREE_BY_GROUP.map((group) => `${group.label} ${formatNumber(group.records)}`).join(", ")}. ${formatNumber(TREE_TOTAL)} records in all.`}
          height="h-96 sm:h-[28rem]"
          legend={
            <>
              {GROUP_KEY.map((group) => (
                <LegendSwatch key={group.key} color={group.color} label={group.label} />
              ))}
            </>
          }
          footnote="A tile’s area is its number of records. One colour marks one group. Grey tiles are the smaller groups and the records with no group. Hover a tile that is too small for its name."
        >
          <GroupTreemap groups={TREE_GROUPS} className="h-full" />
        </ChartFrame>

        <div className="grid gap-3 lg:grid-cols-2">
          <ChartFrame
            title="Share of each country’s records, by method"
            description="StackedBar with expand: the same parts in every row"
            ariaLabel={`Stacked bars of DNA records by method for ${COUNTRY_METHOD_ROWS.map((row) => row.key).join(", ")}. Every bar shows shares of 100 percent.`}
            height="h-64"
            legend={
              <>
                {METHOD_SERIES.map((method) => (
                  <LegendSwatch key={method.key} color={method.color} label={method.label} />
                ))}
              </>
            }
            footnote="Every bar has the same length. A part’s width is its share of the country’s records. Hover a part to see its count."
          >
            <StackedBar
              data={COUNTRY_METHOD_ROWS}
              series={METHOD_SERIES}
              layout="vertical"
              expand
              className="h-full"
            />
          </ChartFrame>

          <ChartFrame
            title="Share of each method’s records that name a species"
            description="RadialBars: several shares of one whole"
            ariaLabel={`Share of records that name a species: ${NAMED_SHARE.map((row) => `${row.label} ${row.text}`).join(", ")}.`}
            height="h-auto"
            footnote="Each ring is one method and runs a full turn for 100 percent. The outer ring is the first row of the key."
          >
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <RadialBars rows={NAMED_SHARE} className="mx-auto max-w-56" />
              <ul className="grid gap-2 text-xs">
                {NAMED_SHARE.map((row) => (
                  <li key={row.key} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 translate-y-0.5 rounded-full"
                      style={{ background: row.color }}
                    />
                    <span className="text-foreground">{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">{row.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ChartFrame>
        </div>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader
          eyebrow="Two measures and time"
          title="Bubbles, streams, matrices and tiles"
          description="These forms answer which things are large and which are covered, when the whole grew, and when each country peaked. Each puts a second measure or a year axis on one figure."
        />
        <ChartFrame
          title="Known species and share with a DNA record, by class"
          description="BubbleField: two measures and a count as size"
          ariaLabel={`Classes by known species and share with a DNA record. ${BUBBLE_TAGGED.map((point) => `${point.label} ${point.y} percent of ${formatNumber(point.x)}`).join(", ")}. All classes together ${BUBBLE_OVERALL} percent.`}
          height="h-80 sm:h-[26rem]"
          legend={
            <>
              {GROUP_KEY.filter((group) => group.key !== "other").map((group) => (
                <LegendSwatch key={group.key} color={group.color} label={group.label} />
              ))}
            </>
          }
          footnote="Each bubble is a class. A bubble further right has more known species. A bubble higher up has a larger share with a DNA record. A bubble’s area is the number of species with a DNA record. The bottom scale is a log scale. The dashed line is the share for all classes together."
        >
          <BubbleField
            points={BUBBLE_POINTS}
            xLabel="Known species"
            yLabel="Share with a DNA record"
            xLog
            xTicks={BUBBLE_TICKS}
            yMax={70}
            yUnit="%"
            reference={{ y: BUBBLE_OVERALL, label: `All classes: ${BUBBLE_OVERALL}%` }}
            className="h-full"
          />
        </ChartFrame>

        <div className="grid gap-3 lg:grid-cols-2">
          <ChartFrame
            title="DNA records by year of collection and method"
            description="StreamArea: when the whole grew and which part did it"
            ariaLabel={`DNA records by year of collection and method, ${MATRIX_YEARS[0]} to ${MATRIX_YEARS[MATRIX_YEARS.length - 1]}. The most were collected in ${STREAM_PEAK.year}: ${formatNumber(STREAM_PEAK.records)}.`}
            height="h-56"
            legend={
              <>
                {METHOD_SERIES.map((method) => (
                  <LegendSwatch key={method.key} color={method.color} label={method.label} />
                ))}
              </>
            }
            footnote="A band’s thickness is the records of one method in that year. The figure has no vertical scale. Hover a year to see the counts."
          >
            <StreamArea
              data={STREAM_DATA}
              series={METHOD_SERIES}
              xTicks={MATRIX_TICKS}
              className="h-full"
            />
          </ChartFrame>

          <div className="grid content-start gap-3">
            <SpecimenLabel
              index="1"
              title="Area sparkline in a metric card"
              description="SparkArea fills the area under one count over time, with the floor at zero"
            />
            <div className="grid grid-cols-2 gap-3">
              {SPARK.map((tile) => (
                <MetricCard
                  key={tile.key}
                  label={tile.label}
                  value={formatNumber(tile.total)}
                  detail={`most in ${tile.peakYear}`}
                  trend={<SparkArea values={tile.values} color={tile.color} className="h-6 w-16" />}
                />
              ))}
            </div>
          </div>
        </div>

        <ChartFrame
          title="DNA records by country and year of collection"
          description="BubbleMatrix: rows by columns"
          ariaLabel={`DNA records by country and year. ${MATRIX_PEAKS.map((row) => `${row.label}: most in ${row.year}, ${row.records}`).join("; ")}.`}
          height="h-auto"
          legend={
            <>
              {METHODS.map((method) => (
                <LegendSwatch key={method.key} color={METHOD_COLOR[method.key]} label={method.label} />
              ))}
            </>
          }
          footnote="A circle’s area is the number of records collected in that country in that year. Its colour is the method with the most records. The figure at the end of a row is the total for the country. On a phone, scroll the figure sideways."
        >
          <div className="overflow-x-auto">
            <BubbleMatrix
              rows={MATRIX_ROWS}
              columns={MATRIX_YEARS}
              columnTicks={MATRIX_TICKS}
              className="mx-auto min-w-[32rem] max-w-3xl"
            />
          </div>
        </ChartFrame>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader
          eyebrow="Maps and packed circles"
          title="Dot map, flow map and packed circles"
          description="These forms answer where records are, where specimens went, and how unequal a group is. A map keeps place and distance. Packed circles show an uneven group without a scale."
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartFrame
            title="DNA records by half-degree square"
            description="DotMap: counts by place, with the surveyed ground"
            ariaLabel={`Map of DNA records in half-degree squares, with country borders. ${formatNumber(DOT_MAP.dotCount)} of ${formatNumber(DOT_MAP.groundCount)} squares with a GBIF record have a DNA record. The largest square, near Site A, has ${DOT_MAP.top} records.`}
            height="h-auto"
            legend={
              <>
                {METHODS.map((method) => (
                  <LegendSwatch key={method.key} color={METHOD_COLOR[method.key]} label={method.label} />
                ))}
                <LegendSwatch color="var(--muted)" label="GBIF records, none from DNA" />
              </>
            }
            footnote="A dot’s area is the number of DNA records in the square. Its colour is the method with the most records. The ring marks a named site. Borders: Natural Earth."
          >
            <DotMap
              ground={DOT_MAP.ground}
              cells={DOT_MAP.cells}
              cell={DOT_MAP.cell}
              box={DOT_MAP.box}
              labels={DOT_MAP.labels}
              borders={DOT_MAP.borders}
              marks={DOT_MAP.marks}
              className="mx-auto max-w-md"
            />
          </ChartFrame>

          <ChartFrame
            title="DNA records by collector"
            description="PackedCircles, laid out with packCircles"
            ariaLabel={`${PACKED_COUNT} collectors. ${PACKED_LEAD.label} has ${formatNumber(PACKED_LEAD.records)} of ${formatNumber(PACKED_TOTAL)} records. The three largest have ${formatNumber(PACKED_TOP_THREE)}.`}
            height="h-auto"
            legend={
              <>
                {METHODS.map((method) => (
                  <LegendSwatch key={method.key} color={METHOD_COLOR[method.key]} label={method.label} />
                ))}
              </>
            }
            footnote="A circle’s area is the collector’s number of records. Its colour is the method the collector used most. A circle shows a name when the name fits. Hover a circle to read the rest."
          >
            <PackedCircles circles={PACKED} size={PACKED_SIZE} className="mx-auto max-w-md" />
          </ChartFrame>
        </div>

        <ChartFrame
          title="Specimens collected in East Africa, by location of the holder"
          description="FlowMap: from one origin to places on a map"
          ariaLabel={`World map of where specimens collected in East Africa are held. ${FLOW_MAP.places.map((place) => `${place.label} ${formatNumber(place.value)}`).join(", ")}. East Africa ${formatNumber(FLOW_MAP.home)}.`}
          height="h-auto"
          legend={
            <>
              <LegendSwatch color="var(--foreground)" label="Held outside East Africa" />
              <LegendSwatch color="var(--primary)" label="Held in East Africa" />
            </>
          }
          footnote={`A circle’s area and a line’s width are the number of specimens. Each circle is at the city of the largest holder in the country. Not named on the map: ${FLOW_MAP.unnamed.join(", ")}. Land: Natural Earth.`}
        >
          <div className="overflow-x-auto">
            <FlowMap
              land={FLOW_MAP.land}
              box={FLOW_MAP.box}
              origin={FLOW_MAP.origin}
              places={FLOW_MAP.places}
              lineColor="var(--foreground)"
              className="mx-auto min-w-[36rem] max-w-4xl"
            />
          </div>
        </ChartFrame>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader
          eyebrow="Identity"
          title="The categorical ramp"
          description="These nine hues are the chart palette. The preset's own five chart steps are one olive-grey at five strengths, which is one colour on screen, so nothing a reader has to tell apart is drawn from them. The nine exist as tokens because their absence produced seventy-one loose hex values across the platform's charts."
        />
        <Specimen
          label="categorical identity · nine steps"
          note="lightness held in a 0.58–0.64 band so no series reads as more important"
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {CATEGORICAL.map((color, index) => (
              <div key={color} className="grid gap-1.5">
                <span
                  className="h-12 rounded-lg ring-1 ring-foreground/10"
                  style={{ background: color }}
                  aria-hidden="true"
                />
                <code className="font-mono text-[0.625rem] text-muted-foreground">
                  cat-{index + 1}
                </code>
              </div>
            ))}
          </div>
        </Specimen>
        <Specimen
          label="categorical bar · three identities"
          note="teal, purple, orange — the three-way split that passes with every pair checked, not the first three swatches"
        >
          <CategoryBar
            data={[
              { key: "BirdNET v3", value: 65.5 },
              { key: "BirdNET v2.4", value: 59.5 },
              { key: "Perch v2", value: 56.7 },
            ]}
            colors={SERIES_TRIO}
            seriesLabel="Top-1 agreement"
            max={100}
            className="h-56 w-full"
          />
        </Specimen>
        <Specimen
          label="bars and line · two axes"
          note="records each year on the left axis, the running total on the right; each axis takes its series' colour"
        >
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.6875rem] text-muted-foreground">
              <LegendSwatch color={SERIES_TRIO[0]} label="Records that year" />
              <LegendSwatch color={SERIES_TRIO[2]} label="Running total" />
            </div>
            <BarLine
              data={BAR_LINE}
              bar={{ key: "value", label: "Records that year", color: SERIES_TRIO[0] }}
              line={{ key: "total", label: "Running total", color: SERIES_TRIO[2] }}
              className="h-56 w-full"
            />
          </div>
        </Specimen>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              title: "Measured, not chosen by eye",
              body: "The weakest step clears 3.5:1 on the light card and 6.9:1 on the dark one, past the 3:1 WCAG 1.4.11 asks of a graphical object. The closest of the thirty-six pairs sits at ΔE(OKLab) 0.11.",
            },
            {
              title: "The ramp assumes a legend",
              body: "ΔE 0.11 is distinguishable side by side and not from memory, so a categorical chart always draws its labels. If there is no room for labels, the chart has too many series for this ramp.",
            },
            {
              title: "Order is stable, or the ramp lies",
              body: "A country that is blue in one figure and red in the next is worse than two countries sharing a colour, because the reader carries the first chart's key into the second. Sort by the domain, never by the values in hand.",
            },
            {
              title: "Allocate with seriesColors, not with the swatch order",
              body: "CATEGORICAL is a hue wheel, so its first three steps are the three warmest hues — red, orange and olive — and a three-series chart drawn from them reads as one colour again. seriesColors(n) spreads the hues out instead. For three series that sit side by side use teal, purple and orange, the set that passes with every pair checked: seriesColors(3) is blue, red and green, and a colour-blind reader cannot separate its red from its green.",
            },
          ].map((rule) => (
            <div key={rule.title} className="grid gap-1.5 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
              <h3 className="font-heading text-xs/relaxed font-medium text-foreground">{rule.title}</h3>
              <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{rule.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader
          eyebrow="States"
          title="Empty and loading charts"
          description="A chart that has no data is still a designed component; the skeleton keeps the same plot height so nothing shifts."
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <Specimen label="chart · empty" note="role=img with no series">
            <div className="grid h-56 place-items-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
              <div className="grid max-w-xs justify-items-center gap-1.5">
                <ChartLineUpIcon className="size-5 text-muted-foreground" />
                <p className="font-heading text-xs/relaxed font-medium text-foreground">
                  No scans recorded yet
                </p>
                <p className="text-[0.6875rem] text-muted-foreground">
                  The first weekly audit run will populate this series.
                </p>
                <Button variant="outline" size="sm" className="mt-1">
                  View the method
                  <ArrowUpRightIcon data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </Specimen>
          <Specimen label="chart · loading" note="same height, aria-busy on the wrapper">
            <div aria-busy="true" aria-label="Loading chart" className="grid gap-3">
              <div className="flex h-56 items-end gap-1.5 rounded-lg bg-muted/20 p-4">
                {[38, 62, 45, 78, 55, 88, 42, 70, 61, 92, 48, 66].map((height, index) => (
                  <span
                    key={index}
                    className="w-full animate-pulse rounded-t bg-muted motion-reduce:animate-none"
                    style={{ height: `${height}%` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <TableSkeleton rows={2} columns={3} label="Loading chart data" />
            </div>
          </Specimen>
        </div>
      </section>

      <section className="grid gap-6 border-t border-border/60 pt-6">
        <SectionHeader
          eyebrow="Rules"
          title="Chart guidance"
          description="Short enough to apply without a design review."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "One hue per series",
              body: "Series, slices and levels each get their own hue from seriesColors, or a status role when they run from good to bad. Never shades of one colour: on screen they are the same colour.",
            },
            {
              title: "Name the measure, not the chart",
              body: "Headings read “Species documented per country”, never “Bar chart”. The chart type is an implementation detail.",
            },
            {
              title: "Keep series semantics apart",
              body: "Observation year is not upload year, and snapshot change is not abundance. Separate charts beat one combined axis.",
            },
            {
              title: "Always subtract the axis chrome",
              body: "No vertical grid lines, no axis lines, ticks in muted-foreground at 10px. The data should be the only dark thing on the panel.",
            },
            {
              title: "Label directly where you can",
              body: "For a single series, prefer a value label over a legend. Legends are for two or three series that must be compared.",
            },
            {
              title: "State the source",
              body: `Every chart footer names the artifact it came from — for example ${regionByCode.get("KE")?.name} media counts sourced from the published checklist.`,
            },
          ].map((rule, index) => (
            <div key={rule.title} className="grid gap-1.5 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.625rem] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-xs/relaxed font-medium text-foreground">{rule.title}</h3>
              </div>
              <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{rule.body}</p>
            </div>
          ))}
        </div>
        {unscored ? (
          <p className="text-[0.6875rem] text-muted-foreground">
            Worked example · <em className="font-serif italic">{unscored.scientificName}</em> is the highest
            scoring featured species with {formatNumber(unscored.audioCount)} audio assets.
          </p>
        ) : null}
      </section>
    </PageContainer>
  );
}
