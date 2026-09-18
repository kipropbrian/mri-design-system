import type { Metadata } from "next";
import {
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  GlobeIcon,
  MapPinIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  TreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { InatScanArea, InatTaxaBar, CHART_COLORS } from "@/components/mri/charts";
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
import { ObservationCard } from "@/components/mri/specimen-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { countryFlag, inat } from "@/lib/data";
import { formatDate, formatNumber, formatPercent, formatRelativeDays, initials } from "@/lib/format";

export const metadata: Metadata = {
  title: "iNaturalist watch",
  description:
    "Country-first audit dashboard: metric strip, scan activity, taxon mix, national distribution, records grid and table.",
};

function scanLabel(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function InaturalistPage() {
  const latest = inat.latestRun;
  const scans = inat.runs.map((run) => ({
    run: run.runId,
    label: scanLabel(run.startedAt),
    newRecords: run.newCount,
    rechecked: run.recheckedCount,
    changed: run.changedCount,
  }));

  const taxaBars = inat.taxa.slice(0, 6).map((row) => ({
    taxon: row.taxon,
    count: row.count,
    share: row.share,
  }));

  const globalFirsts = inat.events.filter((event) => event.globalFirst).length;
  const stable = inat.events.filter((event) => event.status === "stable").length;
  const maxCountry = Math.max(...inat.countries.map((country) => country.speciesCount));

  return (
    <PageContainer size="wide" className="grid gap-10 py-10 sm:py-10">
      <PageHeader
        eyebrow="East Africa · Weekly species audit"
        title="Which species are new to each country?"
        description="Research-grade, photo-backed observations that are new to a national list. Each weekly run re-checks every open record and promotes it once three or more identifiers agree."
        status={
          <>
            <StatusBadge tone="positive">
              <ShieldCheckIcon className="size-3" weight="fill" />
              Current to {formatDate(inat.publishedAt)}
            </StatusBadge>
            <Badge variant="outline">{inat.countries.length} countries · {formatNumber(inat.eventCount)} records</Badge>
            <Badge variant="outline">Snapshot {inat.publishedRunId}</Badge>
          </>
        }
        actions={
          <Button nativeButton={false}
            variant="outline"
            render={<a href="https://www.inaturalist.org" target="_blank" rel="noreferrer" />}
          >
            Open iNaturalist
            <ArrowSquareOutIcon data-icon="inline-end" />
          </Button>
        }
      />

      <MetricStrip label="Audit summary">
        <MetricCard
          label="Monitored countries"
          value={String(inat.countries.length)}
          detail={`${formatNumber(inat.eventCount)} events tracked`}
          icon={<MapPinIcon className="size-3" />}
        />
        <MetricCard
          label="New this run"
          value={formatNumber(latest?.newCount ?? 0)}
          detail={latest ? `${formatRelativeDays(latest.startedAt, new Date(inat.publishedAt))}` : "—"}
          icon={<CalendarBlankIcon className="size-3" />}
        />
        <MetricCard
          label="Global firsts"
          value={String(globalFirsts)}
          detail="First observation worldwide"
          icon={<GlobeIcon className="size-3" />}
        />
        <MetricCard
          label="Verified stable"
          value={`${stable}/${inat.events.length}`}
          detail="Three or more agreeing IDs"
          icon={<ShieldCheckIcon className="size-3" />}
        />
      </MetricStrip>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Trends"
          title="Scan activity and taxon mix"
          description="Two questions, two charts. Scan activity is a time series; taxon mix is a distribution and does not belong on the same axes."
        />
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ChartFrame
            title={`Weekly scan activity (${inat.runCount} runs)`}
            description="Records rechecked against new records per audit run"
            action={<Badge variant="outline">Latest {inat.publishedRunId}</Badge>}
            ariaLabel="Area chart of new and rechecked records per audit run"
            legend={
              <>
                <LegendSwatch color={CHART_COLORS.strong} label="New records" />
                <LegendSwatch color={CHART_COLORS.mid} label="Records rechecked" />
              </>
            }
            footnote={`Every run re-checks all open records, so the recheck series grows as coverage widens.`}
          >
            <InatScanArea data={scans} className="h-64 w-full" />
          </ChartFrame>

          <ChartFrame
            title="Country-firsts by taxon"
            description="Records per iconic taxon group"
            ariaLabel="Horizontal bar chart of records per iconic taxon group"
            height="h-64"
            footnote="Plants lead because under-documented floras dominate new national records."
          >
            <InatTaxaBar data={taxaBars} className="h-64 w-full" />
          </ChartFrame>
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Coverage"
          title={`National catalog distribution (${inat.countries.length})`}
          description="Species documented per monitored country. Counts describe catalog documentation, not abundance."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {inat.countries.map((country) => (
            <div
              key={country.code}
              className="grid gap-3 rounded-lg bg-card p-3 ring-1 ring-foreground/10 transition-colors hover:ring-primary/30"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-base leading-none" aria-hidden="true">
                    {countryFlag(country.code)}
                  </span>
                  <span className="truncate font-heading text-xs/relaxed font-medium text-foreground">
                    {country.name}
                  </span>
                </span>
                <Badge variant="outline" className="font-mono">
                  {country.code}
                </Badge>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-medium tabular-nums text-foreground">
                  {formatNumber(country.speciesCount)}
                </span>
                <span className="text-[0.625rem] text-muted-foreground">species</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((country.speciesCount / maxCountry) * 100)}%` }}
                />
              </div>
              <SourceNote>Scanned {formatDate(country.lastScanAt)}</SourceNote>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Records"
          title="Latest verified country firsts"
          description="Media-first cards: the photograph is the evidence, so it leads. Attribution and licence travel with every image."
          action={<Badge variant="outline">Showing {inat.events.length} of {formatNumber(inat.eventCount)}</Badge>}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {inat.events.map((record) => (
            <ObservationCard key={record.eventId} record={record} />
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Ledger"
          title="Country-first ledger"
          description="The same data as a table, for scanning and comparison. Numeric columns are right-aligned and monospace."
        />
        <Panel
          title={`All country firsts (${formatNumber(inat.eventCount)})`}
          description="Newest detections, all monitored countries"
          action={<Badge variant="secondary">Page 1 of 43</Badge>}
          contentClassName="grid gap-0 p-0"
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead className="hidden sm:table-cell">Country</TableHead>
                  <TableHead className="hidden md:table-cell">Taxon</TableHead>
                  <TableHead className="hidden lg:table-cell">Observer</TableHead>
                  <TableHead className="hidden lg:table-cell">Observed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">IDs</TableHead>
                  <TableHead className="hidden text-right xl:table-cell">Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inat.events.map((record, index) => (
                  <TableRow key={record.eventId}>
                    <TableCell className="text-center font-mono text-[0.6875rem] text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="max-w-[240px]">
                      <span className="grid min-w-0">
                        <span className="truncate font-medium text-foreground">
                          {record.commonName ?? record.scientificName}
                        </span>
                        {record.commonName ? (
                          <span className="truncate font-serif text-[0.6875rem] italic text-muted-foreground">
                            {record.scientificName}
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true">{countryFlag(record.countryCode)}</span>
                        <span className="font-mono text-[0.6875rem] text-muted-foreground">
                          {record.countryCode}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {record.iconicTaxon}
                    </TableCell>
                    <TableCell className="hidden max-w-[150px] lg:table-cell">
                      <span className="flex items-center gap-1.5">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[0.625rem] font-medium text-foreground">
                          {initials(record.observer)}
                        </span>
                        <span className="truncate text-muted-foreground">@{record.observer}</span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden font-mono text-[0.6875rem] tabular-nums text-muted-foreground lg:table-cell">
                      {record.observedOn}
                    </TableCell>
                    <TableCell>
                      {/* Monitoring is the default state, so it renders as an
                          absence rather than a chip — matching the live page. */}
                      {record.status === "stable" ? (
                        <StatusBadge tone="positive" icon={<SealCheckIcon weight="fill" />}>
                          Stable
                        </StatusBadge>
                      ) : record.status === "withdrawn" ? (
                        <StatusBadge tone="negative">Withdrawn</StatusBadge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {record.supportCount}
                    </TableCell>
                    <TableCell className="hidden text-right font-mono text-[0.6875rem] tabular-nums text-muted-foreground xl:table-cell">
                      {record.detectedAt.slice(0, 10)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                Detected date is when MRI found the record; observed date is when the observer recorded it.
              </TableCaption>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 p-3 sm:flex-row">
            <p className="order-2 text-[0.6875rem] text-muted-foreground sm:order-1">
              Showing <span className="font-medium tabular-nums text-foreground">1</span>–
              <span className="font-medium tabular-nums text-foreground">
                {inat.events.length}
              </span>{" "}
              of{" "}
              <span className="font-medium tabular-nums text-foreground">
                {formatNumber(inat.eventCount)}
              </span>{" "}
              species
            </p>
            <Pagination className="order-1 mx-0 w-auto sm:order-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink>2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink>3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </Panel>
      </section>

      <section className="grid gap-3">
        <SectionHeader eyebrow="Method" title="How a record becomes stable" />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel contentClassName="grid gap-3">
            <ol className="grid gap-3">
              {[
                {
                  title: "Detected",
                  body: "A weekly run finds a research-grade, photo-backed observation for a species with no prior verified national record.",
                },
                {
                  title: "Monitoring",
                  body: "The record opens with the identifiers it has. MRI re-checks it on every subsequent run.",
                },
                {
                  title: "Stable",
                  body: "Three or more agreeing identifications promote the record. Withdrawals are kept in the audit trail.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[0.625rem] font-medium text-primary-ink">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-xs/relaxed font-medium text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Latest run" description={latest?.runId} contentClassName="grid gap-3">
            {latest
              ? [
                  { term: "Started", value: formatDate(latest.startedAt) },
                  { term: "Requests", value: formatNumber(latest.requestCount) },
                  { term: "New", value: formatNumber(latest.newCount) },
                  { term: "Rechecked", value: formatNumber(latest.recheckedCount) },
                  { term: "Promoted", value: formatNumber(latest.promotedCount) },
                  { term: "Withdrawn", value: formatNumber(latest.withdrawnCount) },
                ].map((row) => (
                  <div
                    key={row.term}
                    className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2 text-[0.6875rem] last:border-0 last:pb-0"
                  >
                    <span className="text-muted-foreground">{row.term}</span>
                    <span className="tabular-nums text-foreground">{row.value}</span>
                  </div>
                ))
              : null}
            <div className="mt-1 rounded-md bg-muted/50 p-3 text-[0.6875rem] text-muted-foreground">
              Taxon share of the current stream:{" "}
              {inat.taxa.slice(0, 3).map((row, index) => (
                <span key={row.taxon}>
                  {index > 0 ? " · " : ""}
                  {row.taxon} {formatPercent(row.share)}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <Specimen label="provenance" note="closes the dashboard">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-3 ring-1 ring-foreground/10">
          <div className="grid gap-1">
            <SourceNote>Source · {inat.source}</SourceNote>
            <SourceNote>
              Snapshot {inat.publishedRunId} · published {formatDate(inat.publishedAt)} ·{" "}
              {formatNumber(inat.eventCount)} events
            </SourceNote>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info">
              <TreeIcon className="size-3" /> {inat.taxa.length} iconic taxa
            </StatusBadge>
            <Eyebrow className="text-muted-foreground">Composition 02 · audit dashboard</Eyebrow>
          </div>
        </div>
      </Specimen>
    </PageContainer>
  );
}
