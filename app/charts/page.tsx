import type { Metadata } from "next";
import { ArrowUpRightIcon, ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr";
import {
  CountryBar,
  GroupedBar,
  InatScanArea,
  InatTaxaBar,
  MultiLine,
  Sparkline,
  StatusDonut,
  CHART_COLORS,
} from "@/components/shell/charts";
import { PageContainer, PageHeader, SectionHeader, Specimen, SpecimenLabel } from "@/components/shell/layout";
import { ChartFrame, LegendSwatch, MetricCard, StatusBadge } from "@/components/shell/patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/shell/patterns";
import { birds, inat, regionByCode } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Charts",
  description:
    "Area, bar, grouped bar, line, donut and sparkline built on ChartContainer and the olive chart ramp.",
};

const CHART_CONTRACT = `const config = {
  newRecords: { label: "New records", color: "var(--chart-4)" },
} satisfies ChartConfig

<ChartContainer config={config} className="h-64 w-full">
  <AreaChart data={data}>
    <Area dataKey="newRecords" stroke="var(--color-newRecords)" fill="url(#grad)" />
  </AreaChart>
</ChartContainer>`;

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
  const lineSeries = inat.yearByCountry.countries.map((country, index) => ({
    key: country.code,
    label: country.name,
    color: [CHART_COLORS.strong, CHART_COLORS.mid, CHART_COLORS.soft, CHART_COLORS.pale][index % 4],
  }));

  const iucnDonut = birds.byIucn
    .filter((row) => row.species > 0)
    .map((row) => ({ key: row.status, label: row.status, value: row.species }));

  const taxaBars = inat.taxa.slice(0, 7).map((row) => ({
    taxon: row.taxon,
    count: row.count,
    share: row.share,
  }));

  const unscored = birds.featured[0];
  const sparkValues = inat.runs.map((run) => run.newCount);

  return (
    <PageContainer size="wide" className="grid gap-10 py-10 sm:py-10">
      <PageHeader
        eyebrow="Charts"
        title="Data displays on the olive ramp"
        description="Every chart is a shadcn ChartContainer over Recharts, wired to the semantic chart tokens. The preset ships a monochrome ramp, so these panels are designed around three series maximum, direct labelling and a manual legend."
        status={
          <>
            <StatusBadge tone="warning">Monochrome ramp · design constraint</StatusBadge>
            <Badge variant="outline">Recharts 3</Badge>
            <Badge variant="outline">Real platform data</Badge>
          </>
        }
      />

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Contract"
          title="How a chart is wired"
          description="Series colours are declared once in the ChartConfig; ChartContainer injects them as --color-<key> for the series to reference."
        />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-[0.6875rem] leading-relaxed text-foreground ring-1 ring-foreground/10">
            {CHART_CONTRACT}
          </pre>
          <div className="grid content-start gap-3">
            <SpecimenLabel
              index="1"
              title="Never hard-code a series colour"
              description="Read var(--color-key). A preset change then recolours every chart at once."
            />
            <SpecimenLabel
              index="2"
              title="Darkest series first"
              description="chart-4 is the strongest step, chart-1 the lightest. Order series by importance, not by dataset order."
            />
            <SpecimenLabel
              index="3"
              title="Legend always visible"
              description="ChartLegend is not used; a labelled row above the plot survives screenshots and print."
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader eyebrow="Time series" title="Area and line" />
        <ChartFrame
          title="Weekly scan activity (10 runs)"
          description="Records rechecked against new records per iNaturalist audit run"
          action={<Badge variant="outline">Latest {inat.publishedRunId}</Badge>}
          ariaLabel="Area chart of new and rechecked records per weekly scan"
          legend={
            <>
              <LegendSwatch color={CHART_COLORS.strong} label="New records" />
              <LegendSwatch color={CHART_COLORS.mid} label="Records rechecked" />
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

      <section className="grid gap-3">
        <SectionHeader eyebrow="Comparison" title="Bars and grouped bars" />
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartFrame
            title="Species documented per country"
            description="East African checklist coverage"
            ariaLabel="Bar chart of documented bird species per country"
            height="h-56"
          >
            <CountryBar data={byCountry} dataKey="value" seriesLabel="Species" className="h-56 w-full" />
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
                    color={[CHART_COLORS.strong, CHART_COLORS.mid, CHART_COLORS.soft][index % 3]}
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
                color: [CHART_COLORS.strong, CHART_COLORS.mid, CHART_COLORS.soft][index % 3],
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

      <section className="grid gap-3">
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
                  <LegendSwatch
                    key={row.key}
                    color={
                      [CHART_COLORS.strong, CHART_COLORS.mid, CHART_COLORS.soft, CHART_COLORS.pale][index % 4]
                    }
                    label={row.label}
                  />
                ))}
              </>
            }
          >
            <StatusDonut data={iucnDonut} className="h-56 w-full" />
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
              title="Primary versus secondary series"
              description="Use --primary only for a single-series chart; switch to the ramp as soon as there are two"
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
                    { key: "species", label: "Species", color: CHART_COLORS.strong },
                    { key: "withAudio", label: "With audio", color: CHART_COLORS.mid },
                  ]}
                  className="h-28 w-full"
                />
              </ChartFrame>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
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

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Rules"
          title="Chart guidance"
          description="Short enough to apply without a design review."
        />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Cap at three series",
              body: "Beyond three, the olive ramp stops being legible. Split into small multiples instead of adding a fourth shade.",
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
