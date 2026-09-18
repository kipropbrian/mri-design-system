import type { Metadata } from "next";
import {
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  GlobeIcon,
  MicrophoneIcon,
  SpeakerHighIcon,
  WaveformIcon,
} from "@phosphor-icons/react/dist/ssr";
import { CountryBar, GroupedBar, CHART_COLORS } from "@/components/shell/charts";
import { Eyebrow, PageContainer, PageHeader, SectionHeader, Specimen } from "@/components/shell/layout";
import {
  ChartFrame,
  LegendSwatch,
  MetricCard,
  MetricStrip,
  Panel,
  SourceNote,
  StatusBadge,
} from "@/components/shell/patterns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { birds, countryFlag } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Xeno-canto watch",
  description:
    "Bioacoustic snapshot: recordings by country, taxa coverage, the most-recorded species and weekly snapshot navigation.",
};

export default function XenoCantoPage() {
  const xenoByCountry = birds.xeno.byCountry.map((country) => ({
    key: country.code,
    name: country.name,
    recordings: country.recordings,
    species: country.species,
  }));

  const topSpecies = birds.xeno.topSpecies;

  const weekLabels = ["30 Aug", "6 Sep", "13 Sep", "20 Sep", "27 Sep"];

  return (
    <PageContainer size="wide" className="grid gap-10 py-10 sm:py-10">
      <PageHeader
        eyebrow="East Africa · Regional sound archive"
        title="Which species still have no recording?"
        description="Wildlife sound coverage across East Africa, measured against the regional checklist. The interesting number is not how many recordings exist, but how many species have none."
        status={
          <>
            <StatusBadge tone="info">
              <WaveformIcon className="size-3" weight="bold" />
              {formatNumber(birds.xeno.totals.speciesWithAudio)} species with audio
            </StatusBadge>
            <Badge variant="outline">
              {formatNumber(birds.xeno.totals.cataloguedSpecies - birds.xeno.totals.speciesWithAudio)}{" "}
              gaps
            </Badge>
            <Badge variant="outline">Snapshot week 38 · 2026</Badge>
          </>
        }
        actions={
          <Button nativeButton={false}
            variant="outline"
            render={<a href="https://xeno-canto.org" target="_blank" rel="noreferrer" />}
          >
            Open Xeno-canto
            <ArrowSquareOutIcon data-icon="inline-end" />
          </Button>
        }
      />

      <MetricStrip label="Archive summary">
        <MetricCard
          label="Recordings"
          value={formatCompact(birds.xeno.totals.recordings)}
          detail="Across the regional checklist"
          icon={<MicrophoneIcon className="size-3" />}
        />
        <MetricCard
          label="Species with audio"
          value={formatNumber(birds.xeno.totals.speciesWithAudio)}
          detail={`of ${formatNumber(birds.xeno.totals.cataloguedSpecies)} catalogued`}
          icon={<SpeakerHighIcon className="size-3" />}
        />
        <MetricCard
          label="Coverage gap"
          value={formatNumber(
            birds.xeno.totals.cataloguedSpecies - birds.xeno.totals.speciesWithAudio,
          )}
          detail="Species with no recording"
          icon={<GlobeIcon className="size-3" />}
        />
        <MetricCard
          label="Snapshot"
          value="Week 38"
          detail="Next scan 27 Sep 2026"
          icon={<CalendarBlankIcon className="size-3" />}
        />
      </MetricStrip>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Snapshot"
          title="Weekly snapshot navigator"
          description="Snapshots are immutable. A reviewer can always step back to the week a claim was made."
          action={<Badge variant="secondary">Latest</Badge>}
        />
        <Specimen label="snapshot · weekly switcher" note="chips, not a dropdown — the week is part of the page's identity">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
            {weekLabels.map((label, index) => (
              <span
                key={label}
                className={
                  index === weekLabels.length - 1
                    ? "inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-[0.6875rem] font-medium text-background"
                    : "inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-[0.6875rem] font-medium text-muted-foreground ring-1 ring-border/60"
                }
              >
                {label}
                {index === weekLabels.length - 1 ? (
                  <span className="rounded-full bg-background/20 px-1.5 font-mono text-[0.5625rem]">
                    latest
                  </span>
                ) : null}
              </span>
            ))}
            <span className="ml-auto text-[0.6875rem] text-muted-foreground">
              Comparing against <span className="font-mono text-foreground">6 Sep</span>
            </span>
          </div>
        </Specimen>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Coverage"
          title="Recordings by country"
          description="Two measures on one panel: how much audio exists, and how many species it covers. They do not move together."
        />
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            title="Recordings per country"
            description="Total catalogued recordings"
            ariaLabel="Bar chart of catalogued recordings per country"
            height="h-60"
          >
            <CountryBar
              data={birds.xeno.byCountry.map((country) => ({
                code: country.code,
                name: country.name,
                flag: country.flag,
                value: country.recordings,
              }))}
              dataKey="value"
              seriesLabel="Recordings"
              className="h-60 w-full"
            />
          </ChartFrame>

          <ChartFrame
            title="Recordings against species covered"
            description="Volume is not coverage"
            ariaLabel="Grouped bar chart of recordings and species covered per country"
            height="h-60"
            legend={
              <>
                <LegendSwatch color={CHART_COLORS.strong} label="Recordings" />
                <LegendSwatch color={CHART_COLORS.mid} label="Species covered" />
              </>
            }
            footnote="Kenya and Tanzania carry most volume; species coverage is much flatter."
          >
            <GroupedBar
              data={xenoByCountry}
              series={[
                { key: "recordings", label: "Recordings", color: CHART_COLORS.strong },
                { key: "species", label: "Species", color: CHART_COLORS.mid },
              ]}
              className="h-60 w-full"
            />
          </ChartFrame>
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Species"
          title="Best-documented species"
          description="Top ten by recording count. Useful as a reference list and as an ear-training source."
          action={<Badge variant="outline">Top 10</Badge>}
        />
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Panel contentClassName="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead>Species</TableHead>
                    <TableHead className="hidden sm:table-cell">Family</TableHead>
                    <TableHead className="text-right">Recordings</TableHead>
                    <TableHead className="text-right">Countries</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Audio assets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSpecies.map((record, index) => (
                    <TableRow key={record.speciesCode}>
                      <TableCell className="text-center font-mono text-[0.6875rem] text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        <span className="grid min-w-0">
                          <span className="truncate font-medium text-foreground">
                            {record.commonName}
                          </span>
                          <span className="truncate font-serif text-[0.6875rem] italic text-muted-foreground">
                            {record.scientificName}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden max-w-[180px] truncate text-muted-foreground sm:table-cell">
                        {record.family}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(record.xenoCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {record.presenceCount}/8
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums text-muted-foreground md:table-cell">
                        {formatNumber(record.audioCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Taxonomy courtesy of Xeno-canto. Audio-asset counts are capped at 30 per species by the
                  reference catalogue, so identical figures mean “at or above the cap”.
                </TableCaption>
              </Table>
            </div>
          </Panel>

          <div className="grid content-start gap-3">
            <Panel title="Species with no recording" description="The gap list a field team would work from" contentClassName="grid gap-2">
              {[
                { name: "Chubb’s Cisticola", code: "chucis1", countries: "RW · UG" },
                { name: "Winding Cisticola", code: "wincis3", countries: "KE · TZ" },
                { name: "Papyrus Gonolek", code: "papgon1", countries: "RW · UG" },
              ].map((row) => (
                <div
                  key={row.code}
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/40 p-3"
                >
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate text-xs/relaxed font-medium text-foreground">
                      {row.name}
                    </span>
                    <span className="font-mono text-[0.625rem] text-muted-foreground">{row.code}</span>
                  </span>
                  <span className="shrink-0 text-[0.625rem] text-muted-foreground">{row.countries}</span>
                </div>
              ))}
              <SourceNote>Illustrative gap list · three species shown for layout review</SourceNote>
            </Panel>

            <Panel title="Country presence" description="Recording coverage by nation" contentClassName="grid gap-2">
              {birds.xeno.byCountry.slice(0, 5).map((country) => (
                <div key={country.code} className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-[0.6875rem]">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true">{countryFlag(country.code)}</span>
                      <span className="text-foreground">{country.name}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNumber(country.recordings)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{
                        width: `${Math.round(
                          (country.recordings / Math.max(1, birds.xeno.byCountry[0].recordings)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      </section>

      <Specimen label="provenance" note="closes the snapshot">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-3 ring-1 ring-foreground/10">
          <div className="grid gap-1">
            <SourceNote>Taxonomy courtesy of Xeno-canto.org</SourceNote>
            <SourceNote>
              {formatNumber(birds.xeno.totals.recordings)} recordings ·{" "}
              {formatNumber(birds.xeno.totals.speciesWithAudio)} species · week 38, 2026 snapshot
            </SourceNote>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="warning">Snapshot, not live</StatusBadge>
            <Eyebrow className="text-muted-foreground">Composition 04 · bioacoustic snapshot</Eyebrow>
          </div>
        </div>
      </Specimen>
    </PageContainer>
  );
}
