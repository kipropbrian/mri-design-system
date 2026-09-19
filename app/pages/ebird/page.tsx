import type { Metadata } from "next";
import {
  ArrowSquareOutIcon,
  CameraIcon,
  ChartLineUpIcon,
  GlobeIcon,
  MicrophoneIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  CountryBar,
  GroupedBar,
  StatusDonut,
} from "@/components/mri/charts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { Eyebrow, PageContainer, PageHeader, SectionHeader, Specimen } from "@/components/mri/layout";
import {
  ChartFrame,
  LegendSwatch,
  MetricCard,
  MetricStrip,
  Panel,
  SourceNote,
  StatusBadge,
} from "@/components/mri/patterns";
import { BirdMediaCard, IucnChip } from "@/components/mri/specimen-card";
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
import { birds, IUCN_LABEL } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "eBird & Macaulay watch",
  description:
    "Regional media dashboard: media volume by family, coverage by country, featured additions and the IUCN profile of the checklist.",
};

export default function EbirdPage() {
  const mediaByCountry = birds.byCountry.map((country) => ({
    key: country.code,
    name: country.name,
    species: country.species,
    withAudio: country.withAudio,
  }));

  const mediaFamilies = birds.mediaByFamily.map((row) => ({
    key: row.family.length > 16 ? `${row.family.slice(0, 15)}…` : row.family,
    audio: row.audio,
    photos: row.photos,
  }));

  const iucnDonut = birds.byIucn
    .filter((row) => row.species > 0)
    .map((row) => ({ key: row.status, label: row.status, value: row.species }));

  const threatened = birds.byIucn
    .filter((row) => ["CR", "EN", "VU"].includes(row.status))
    .reduce((sum, row) => sum + row.species, 0);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="East Africa · Regional media archive"
        title="Where are East Africa’s bird records documented?"
        description="Media coverage by country, family and taxon across the eBird and Macaulay Library archives, reconciled against the regional checklist."
        status={
          <>
            <StatusBadge tone="info">
              <ChartLineUpIcon className="size-3" weight="bold" />
              {formatNumber(birds.totalSpecies)} species in scope
            </StatusBadge>
            <Badge variant="outline">{formatNumber(birds.mediaTotals.speciesWithMedia)} with media</Badge>
            <Badge variant="outline">{birds.countries.length} countries</Badge>
          </>
        }
        actions={
          <Button nativeButton={false}
            variant="outline"
            render={<a href="https://media.ebird.org" target="_blank" rel="noreferrer" />}
          >
            Open Macaulay Library
            <ArrowSquareOutIcon data-icon="inline-end" />
          </Button>
        }
      />

      <MetricStrip label="Archive summary">
        <MetricCard
          label="Photos"
          value={formatCompact(birds.mediaTotals.photos)}
          detail="Catalogued image assets"
          icon={<CameraIcon className="size-3" />}
        />
        <MetricCard
          label="Audio recordings"
          value={formatCompact(birds.mediaTotals.audio)}
          detail={`${formatNumber(birds.xeno.totals.speciesWithAudio)} species with sound`}
          icon={<MicrophoneIcon className="size-3" />}
        />
        <MetricCard
          label="Video"
          value={formatCompact(birds.mediaTotals.video)}
          detail="Catalogued clips"
          icon={<VideoCameraIcon className="size-3" />}
        />
        <MetricCard
          label="Regional coverage"
          value={`${birds.countries.length} countries`}
          detail={`${formatNumber(birds.familyCount)} families`}
          icon={<GlobeIcon className="size-3" />}
        />
      </MetricStrip>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Comparison"
          title="Coverage by country and family"
          description="Country comparison first, historical and taxonomic detail after — the order a field reviewer actually asks the questions in."
        />
        <div className="grid gap-3 xl:grid-cols-2">
          <ChartFrame
            title="Documented species per country"
            description="All checklist species against those with audio coverage"
            ariaLabel="Grouped bar chart of documented species and species with audio per country"
            legend={
              <>
                <LegendSwatch color={CHART_COLORS.strong} label="Documented species" />
                <LegendSwatch color={CHART_COLORS.mid} label="Species with audio" />
              </>
            }
            footnote="A country can be well documented and still under-recorded for sound."
          >
            <GroupedBar
              data={mediaByCountry}
              series={[
                { key: "species", label: "Species", color: CHART_COLORS.strong },
                { key: "withAudio", label: "With audio", color: CHART_COLORS.mid },
              ]}
              className="h-64 w-full"
            />
          </ChartFrame>

          <ChartFrame
            title="Media volume by family"
            description="Top eight families by audio assets, photographs alongside"
            ariaLabel="Grouped bar chart of audio and photo assets per bird family"
            legend={
              <>
                <LegendSwatch color={CHART_COLORS.strong} label="Photos" />
                <LegendSwatch color={CHART_COLORS.mid} label="Audio" />
              </>
            }
            footnote="Ranked by audio because audio coverage is the scarcer signal."
          >
            <GroupedBar
              data={mediaFamilies}
              series={[
                { key: "photos", label: "Photos", color: CHART_COLORS.strong },
                { key: "audio", label: "Audio", color: CHART_COLORS.mid },
              ]}
              className="h-64 w-full"
            />
          </ChartFrame>
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Media"
          title="Featured additions"
          description="Highest-scoring species with recent verified media. Each card carries its family, IUCN status, media counts and regional presence."
          action={<Badge variant="outline">Top {birds.featured.length} by occurrence score</Badge>}
        />
        <p className="text-[0.6875rem] text-muted-foreground">
          Media counts are capped at 30 per species by the reference catalogue, so a row of identical
          figures means “at or above the cap”, not an exact tally.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {birds.featured.map((record) => (
            <BirdMediaCard key={record.speciesCode} record={record} />
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Taxonomy"
          title="Family ledger"
          description="Species, media assets and IUCN composition per family."
        />
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel contentClassName="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Family</TableHead>
                    <TableHead className="hidden sm:table-cell">Order</TableHead>
                    <TableHead className="text-right">Species</TableHead>
                    <TableHead className="text-right">Photos</TableHead>
                    <TableHead className="text-right">Audio</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Audio / species</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {birds.mediaByFamily.map((row) => (
                    <TableRow key={row.family}>
                      <TableCell className="max-w-[220px] truncate font-medium text-foreground">
                        {row.family}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {birds.byFamily.find((family) => family.family === row.family)?.order ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.species)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatNumber(row.photos)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.audio)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums text-muted-foreground lg:table-cell">
                        {Math.round(row.audio / Math.max(1, row.species))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Based on catalogued assets, not observation effort. Coverage is not abundance.
                </TableCaption>
              </Table>
            </div>
          </Panel>

          <div className="grid content-start gap-3">
            <ChartFrame
              title="Checklist by IUCN status"
              description={`${formatNumber(threatened)} species are threatened (CR, EN or VU)`}
              ariaLabel="Donut chart of checklist species by IUCN status"
              height="h-52"
              legend={
                <>
                  {iucnDonut.map((row, index) => (
                    <LegendSwatch
                      key={row.key}
                      color={
                        [CHART_COLORS.strong, CHART_COLORS.mid, CHART_COLORS.soft, CHART_COLORS.pale][
                          index % 4
                        ]
                      }
                      label={row.label}
                    />
                  ))}
                </>
              }
            >
              <StatusDonut data={iucnDonut} className="h-52 w-full" />
            </ChartFrame>

            <Panel title="Threatened species" description="Red List categories in the regional checklist" contentClassName="grid gap-1.5">
              {birds.byIucn
                .filter((row) => ["CR", "EN", "VU", "NT"].includes(row.status))
                .map((row) => (
                  <div key={row.status} className="flex items-center justify-between gap-2 text-xs/relaxed">
                    <span className="flex items-center gap-2">
                      <IucnChip status={row.status} />
                      <span className="text-muted-foreground">{IUCN_LABEL[row.status]}</span>
                    </span>
                    <span className="tabular-nums text-foreground">
                      {formatNumber(row.species)}
                    </span>
                  </div>
                ))}
            </Panel>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Coverage"
          title="Documented species against national checklists"
          description="Raw country totals, for when the grouped comparison above is too dense."
        />
        <ChartFrame
          title="Species documented per country"
          description="Single-series comparison, primary colour"
          ariaLabel="Bar chart of documented species per country"
          height="h-56"
          footnote="Use one series and one colour when there is only one question."
        >
          <CountryBar
            data={birds.byCountry.map((country) => ({
              code: country.code,
              name: country.name,
              flag: country.flag,
              value: country.species,
            }))}
            dataKey="value"
            seriesLabel="Species"
            color="var(--primary)"
            className="h-56 w-full"
          />
        </ChartFrame>
      </section>

      <Specimen label="provenance" note="closes the dashboard">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-3 ring-1 ring-foreground/10">
          <div className="grid gap-1">
            <SourceNote>Source · {birds.source}</SourceNote>
            <SourceNote>
              Regional checklist {formatNumber(birds.totalSpecies)} species · {birds.byChecklist.length}{" "}
              checklist sources · {formatNumber(birds.mediaTotals.speciesWithMedia)} species with media
            </SourceNote>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="warning">Snapshot, not live</StatusBadge>
            <Eyebrow className="text-muted-foreground">Composition 03 · media dashboard</Eyebrow>
          </div>
        </div>
      </Specimen>
    </PageContainer>
  );
}
