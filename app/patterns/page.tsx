import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  DatabaseIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  TreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Chip } from "@/components/mri/chips";
import { PageContainer, PageHeader, SectionHeader, Specimen, SpecimenLabel } from "@/components/mri/layout";
import {
  ErrorState,
  EmptyState,
  FilterSidebar,
  LoadingState,
  MetricCard,
  MetricStrip,
  MetricStripSkeleton,
  Panel,
  RecordChange,
  SourceNote,
  StatusPath,
  StatusBadge,
  TableSkeleton,
} from "@/components/mri/patterns";
import { BirdMediaCard, ObservationCard } from "@/components/mri/specimen-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
import { birds, countryFlag, inat } from "@/lib/data";
import { formatDate, formatNumber, formatRelativeDays, initials } from "@/lib/format";

export const metadata: Metadata = {
  title: "Page patterns",
  description:
    "The higher-level MRI concepts layered on the preset: page headers, metric strips, panels, filter bars, tables, media grids and data states.",
};

const DENSITY_RULES = [
  {
    surface: "Cards and panels",
    rule: "gap-(--card-spacing) · py-(--card-spacing)",
    usage: "Default spacing for standalone panels, small spacing inside metric strips",
  },
  {
    surface: "Metric values",
    rule: "text-xl tabular-nums",
    usage: "Counts, percentages and scores — never proportional figures",
  },
  {
    surface: "Data table cells",
    rule: "p-2 text-xs/relaxed",
    usage: "Compact cells; numeric columns right-aligned with tabular-nums",
  },
  {
    surface: "Table headers",
    rule: "h-10 px-2 font-medium",
    usage: "Sentence case, no uppercase eyebrows inside cards",
  },
  {
    surface: "Buttons",
    rule: "h-7 text-xs/relaxed (default) · h-6 (sm)",
    usage: "The preset's compact scale; use lg only for a page's single primary action",
  },
  {
    surface: "Section rhythm",
    rule: "gap-10 between sections · gap-3 within",
    usage: "One heading per section, one section per question",
  },
];

export default function PatternsPage() {
  const latest = inat.latestRun;
  const topCountries = inat.countries.slice(0, 6);
  const observations = inat.events.slice(0, 3);
  const media = birds.featured.slice(0, 4);
  const contributors = Array.from(new Set(inat.events.map((event) => event.observer))).slice(0, 5);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Page patterns"
        title="The compositions every MRI screen is built from"
        description="These are the layers above the primitives. They exist because the same arrangement — a header, a metric strip, a panel, a table, a media grid, a data state — repeats on every route. Each one is a real screen reduced to its skeleton and filled with real data."
        status={
          <>
            <StatusBadge tone="positive">
              <ShieldCheckIcon className="size-3" weight="fill" />
              Current to {formatDate(inat.publishedAt)}
            </StatusBadge>
            <Badge variant="outline">{inat.countries.length} countries</Badge>
            <Badge variant="outline">{formatNumber(inat.eventCount)} records</Badge>
          </>
        }
        actions={
          <>
            <a href="https://platform.maiyoinstitute.org" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
              Open the live platform
              <ArrowSquareOutIcon data-icon="inline-end" />
            </a>
            <Link href="/pages/inaturalist" className={buttonVariants()}>
              See it on a full page
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </>
        }
      />

      {/* ------------------------------------------------------ 1. page shell */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="01 · Shell"
          title="Container and header"
          description="Every route opens with the same three lines: a scope eyebrow, a question-shaped title, and a description that says what the page will answer."
        />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Panel>
            <div className="grid gap-4">
              <PageHeader
                eyebrow="East Africa · Regional overview"
                title="Which species are new to each country?"
                description="Verified, photo-backed records that are new to a national list, re-checked every week against iNaturalist."
                status={<StatusBadge tone="positive">Stable · 3+ agreeing IDs</StatusBadge>}
                actions={
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                }
                className="border-b-0 pb-0"
              />
            </div>
          </Panel>
          <div className="grid content-start gap-3">
            <SpecimenLabel
              index="1"
              title="Use PageContainer, never a bare div"
              description="wide (max-w-7xl) for dashboards and catalogs, default (max-w-6xl) for tools, reading (max-w-3xl) only for prose."
            />
            <SpecimenLabel
              index="2"
              title="The title asks the question"
              description="“Which species are new to each country?” beats “Country firsts”. Research tools should state their purpose."
            />
            <SpecimenLabel
              index="3"
              title="Status carries the data currency"
              description="A reviewer must be able to tell instantly whether they are looking at live, staged or sample data."
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- 2. metric strip */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="02 · Summary"
          title="Metric strip"
          description="Four numbers maximum, in one band, above the fold. Each card answers a different question: how much, how current, how complete, how fast."
        />
        <MetricStrip label="Regional summary">
          <MetricCard
            label="Documented species"
            value={formatNumber(birds.totalSpecies)}
            detail={`${birds.familyCount} families · 8 nations`}
            icon={<TreeIcon className="size-3" />}
          />
          <MetricCard
            label="Country firsts"
            value={formatNumber(inat.eventCount)}
            detail={`${inat.countries.length} monitored countries`}
            icon={<MapPinIcon className="size-3" />}
          />
          <MetricCard
            label="New this scan"
            value={formatNumber(latest?.newCount ?? 0)}
            detail={latest ? formatRelativeDays(latest.startedAt, new Date(inat.publishedAt)) : "—"}
            icon={<CalendarBlankIcon className="size-3" />}
          />
          <MetricCard
            label="Audio assets"
            value={formatNumber(birds.xeno.totals.recordings)}
            detail={`${formatNumber(birds.xeno.totals.speciesWithAudio)} species covered`}
            icon={<DatabaseIcon className="size-3" />}
          />
        </MetricStrip>
        <div className="grid gap-3 sm:grid-cols-2">
          <Specimen label="metric strip · loading" note="identical grid and geometry">
            <MetricStripSkeleton count={4} />
          </Specimen>
          <Specimen label="metric strip · rules" note="what keeps the band level">
            <ul className="grid gap-1.5 text-[0.6875rem] text-muted-foreground">
              <li>· Every value is monospace and tabular so the band never jitters between renders.</li>
              <li>· Keep labels under ~20 characters; they truncate rather than wrap to protect row height.</li>
              <li>· Exactly four cards on desktop, two on mobile. Five is a design smell — split the section.</li>
            </ul>
          </Specimen>
        </div>
      </section>

      {/* --------------------------------------------------- 3. data card header */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="03 · Panels"
          title="The data-card header"
          description="Title with its item count in parentheses, one short line of description, and an optional right slot for a control. This is the single most repeated block in the platform."
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <Panel
            title={`National catalog distribution (${topCountries.length})`}
            description={`Top ${topCountries.length} of ${inat.countries.length} monitored countries`}
            action={<Badge variant="secondary">Top 10</Badge>}
          >
            <ul className="grid gap-1.5">
              {topCountries.map((country) => (
                <li key={country.code} className="flex items-center justify-between gap-2 text-xs/relaxed">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span aria-hidden="true">{countryFlag(country.code)}</span>
                    <span className="truncate text-foreground">{country.name}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(country.speciesCount)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="Audio contributors (5)"
            description="Ranked by verified records"
            action={
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search" className="h-7 w-32 pl-7 text-xs/relaxed" />
              </div>
            }
          >
            <ul className="grid gap-1.5">
              {contributors.map((name, index) => (
                <li key={name} className="flex items-center gap-2 text-xs/relaxed">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[0.625rem] font-medium text-foreground">
                    {initials(name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">@{name}</span>
                  <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
                    {formatNumber(320 - index * 47)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            title="What is a country first?"
            description="Three short paragraphs, no card chrome inside"
            action={<Badge variant="outline">Method</Badge>}
          >
            <div className="grid gap-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
              <p>
                A country first is a research-grade, photo-backed observation whose species has no prior
                verified record in that country.
              </p>
              <p>
                Records start as <strong className="font-medium text-foreground">Monitoring</strong> and
                become <strong className="font-medium text-foreground">Stable</strong> after three or more
                agreeing identifications.
              </p>
            </div>
          </Panel>
        </div>
        <Specimen
          label="data card header · the three rules worth promoting"
          note="generic, and previously only recorded platform-side"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "The title carries its count",
                body: "Species Added & Updated (14), National Catalog Distribution (9). A bare title is the exception, not the default.",
              },
              {
                title: "The description is one line, about 40 characters",
                body: "The header truncates rather than wraps so cards sharing a row keep equal header heights. Longer detail goes in a tooltip or the body.",
              },
              {
                title: "No uppercase eyebrow inside a data card",
                body: "The title already names the section; an eyebrow duplicates it and breaks row alignment. Eyebrows stay on page headers and prose panels.",
              },
            ].map((rule) => (
              <Panel key={rule.title} size="sm">
                <div className="grid gap-1.5">
                  <h3 className="font-heading text-xs/relaxed font-medium text-foreground">
                    {rule.title}
                  </h3>
                  <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{rule.body}</p>
                </div>
              </Panel>
            ))}
          </div>
        </Specimen>
      </section>

      {/* ------------------------------------------------------- 4. filter bar */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="04 · Input"
          title="Filter bar"
          description="Filters never push data below the fold. Desktop gets a compact two-row ribbon; mobile collapses the same controls into a sheet."
        />
        <Specimen label="filter bar · desktop ribbon" note="two rows: controls, then chips and result count">
          <div className="grid gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search species, observer or id" className="h-8 pl-8 text-xs/relaxed lg:col-span-2" />
              </div>
              <NativeSelect defaultValue="all" aria-label="Country" className="h-8 text-xs/relaxed">
                <NativeSelectOption value="all">All countries</NativeSelectOption>
                {inat.countries.map((country) => (
                  <NativeSelectOption key={country.code} value={country.code}>
                    {country.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect defaultValue="all" aria-label="Taxon" className="h-8 text-xs/relaxed">
                <NativeSelectOption value="all">All taxa</NativeSelectOption>
                {inat.taxa.slice(0, 6).map((taxon) => (
                  <NativeSelectOption key={taxon.taxon} value={taxon.taxon}>
                    {taxon.taxon}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <div className="flex items-center gap-2">
                <NativeSelect defaultValue="30" aria-label="Window" className="h-8 text-xs/relaxed">
                  <NativeSelectOption value="7">Last 7 days</NativeSelectOption>
                  <NativeSelectOption value="30">Last 30 days</NativeSelectOption>
                  <NativeSelectOption value="all">All time</NativeSelectOption>
                </NativeSelect>
                <Button variant="outline" size="sm" className="shrink-0 lg:hidden">
                  <SlidersHorizontalIcon data-icon="inline-start" />
                  Filters
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Quick filters
                </span>
                {/* Toggle chips are the same Chip as every other chip; only the
                    tone changes between on and off. */}
                <Chip tone="primary" className="cursor-pointer">
                  Global firsts
                </Chip>
                <Chip tone="primary" className="cursor-pointer">
                  Stable only
                </Chip>
                <Chip tone="neutral" className="cursor-pointer">
                  Has photo
                </Chip>
                <Chip tone="neutral" className="cursor-pointer">
                  Withdrawn
                </Chip>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground">
                Showing <span className="font-medium tabular-nums text-foreground">12</span> of{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {formatNumber(inat.eventCount)}
                </span>{" "}
                records
              </p>
            </div>
          </div>
        </Specimen>

        <Specimen label="filter bar · mobile" note="same filters, collapsed behind one button">
          <div className="flex items-center gap-2 rounded-lg bg-card p-2 ring-1 ring-foreground/10 sm:max-w-sm">
            <Button variant="outline" size="sm" className="flex-1 justify-between">
              Filters
              <span className="flex items-center gap-1.5">
                <Badge variant="secondary">3</Badge>
                <CaretDownIcon className="size-3" />
              </span>
            </Button>
            <span className="text-[0.6875rem] text-muted-foreground">12 of 506</span>
          </div>
        </Specimen>

        <p className="text-[0.6875rem] text-muted-foreground">
          <FunnelIcon className="mr-1 inline size-3 align-[-1px]" />
          Rule: if the filters take more vertical space than the first data row, collapse them.
        </p>
        <Specimen
          label="filter sidebar · persistent, desktop only"
          note="the ribbon and the sidebar are alternatives, not variants"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10">
              <div className="flex min-h-[48px] flex-col justify-center gap-0.5 border-b border-border/60 px-3 py-3">
                <h3 className="truncate text-sm font-medium tracking-tight text-foreground">
                  Verified country firsts (12)
                </h3>
                <p className="truncate text-[0.6875rem] text-muted-foreground">
                  Filtered by Kenya, plants, stable
                </p>
              </div>
              <div className="grid gap-2 p-3">
                {inat.events.slice(0, 4).map((record) => (
                  <div key={record.eventId} className="grid gap-0.5 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <span className="truncate text-xs/relaxed font-medium text-foreground">
                      {record.commonName ?? record.scientificName}
                    </span>
                    <span className="truncate font-serif text-[0.6875rem] italic text-muted-foreground">
                      {record.scientificName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <FilterSidebar
              title="Filters"
              description="Applies to the ledger"
              count={inat.countries.length}
              groups={[
                {
                  legend: "Country",
                  options: [
                    { label: "Kenya", count: 1151, checked: true },
                    { label: "Tanzania", count: 1076 },
                    { label: "Uganda", count: 1047 },
                    { label: "Rwanda", count: 803 },
                  ],
                },
                {
                  legend: "Taxon",
                  options: [
                    { label: "Plants", count: 181, checked: true },
                    { label: "Insects", count: 114 },
                    { label: "Birds", count: 18 },
                  ],
                },
                {
                  legend: "Verification",
                  options: [
                    { label: "Stable only", checked: true },
                    { label: "Has photo" },
                  ],
                },
              ]}
              footer="1,151 species in scope · 399 records rechecked this scan"
            />
          </div>
        </Specimen>
      </section>

      {/* ------------------------------------------------------- 5. data table */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="05 · Records"
          title="Table card with pagination"
          description="Semantic table elements, horizontal containment instead of truncation, monospace numerics, and a footer that states the range in words."
        />
        <Specimen label="data table · country firsts" note="Page 1 of 18 · 12 rows per page">
          <Panel
            title={`Verified country firsts (${formatNumber(inat.eventCount)})`}
            description="Newest detections across monitored countries"
            action={<Badge variant="outline">Latest {inat.publishedRunId}</Badge>}
            contentClassName="grid gap-0 p-0"
          >
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-8 text-center">#</TableHead>
        <TableHead>Species</TableHead>
        <TableHead className="hidden sm:table-cell">Country</TableHead>
        <TableHead className="hidden md:table-cell">Observer</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">IDs</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {inat.events.slice(0, 8).map((record, index) => (
        <TableRow key={record.eventId}>
          <TableCell className="text-center font-mono text-[0.6875rem] text-muted-foreground">
            {index + 1}
          </TableCell>
          <TableCell className="max-w-[220px]">
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
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden="true">{countryFlag(record.countryCode)}</span>
              <span className="font-mono text-[0.6875rem] text-muted-foreground">
                {record.countryCode}
              </span>
            </span>
          </TableCell>
          <TableCell className="hidden max-w-[140px] truncate text-muted-foreground md:table-cell">
            @{record.observer}
          </TableCell>
          <TableCell>
            {record.status === "stable" ? (
              <StatusBadge tone="positive" icon={<SealCheckIcon weight="fill" />}>
                Stable
              </StatusBadge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {record.supportCount}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableCaption>
      Country counts describe catalog documentation, not wildlife abundance.
    </TableCaption>
  </Table>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 p-3 sm:flex-row">
              <p className="order-2 text-[0.6875rem] text-muted-foreground sm:order-1">
                Showing{" "}
                <span className="font-medium tabular-nums text-foreground">1</span>–
                <span className="font-medium tabular-nums text-foreground">12</span> of{" "}
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
        </Specimen>

        <Specimen label="data table · loading" note="same table geometry, aria-busy on the wrapper">
          <TableSkeleton rows={6} columns={5} label="Loading country firsts" />
        </Specimen>
        <Specimen
          label="record change · status path"
          note="a verification state is not just where it landed — it is what it changed from"
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <RecordChange
              title="Evidence changed after review"
              description="Two agreeing identifications were withdrawn, so the record dropped back below the stable threshold."
              steps={[
                { label: "Monitoring", tone: "neutral" },
                { label: "Stable", tone: "positive" },
                { label: "Monitoring", tone: "warning" },
              ]}
              timestamp="Checked 18 Sep 2026 · 3 reviews on this record"
            />
            <Panel
              title="Status path on its own"
              description="Used inline in a table row when the change is the point"
              contentClassName="grid gap-3"
            >
              <StatusPath steps={[{ label: "monitoring" }, { label: "stable", tone: "positive" }]} />
              <StatusPath steps={[{ label: "stable", tone: "positive" }, { label: "withdrawn", tone: "negative" }]} />
              <p className="text-[0.6875rem] text-muted-foreground">
                The state a record is <em>in</em> gets a chip everywhere. The path it took gets one only
                when a reviewer needs to know what changed.
              </p>
            </Panel>
          </div>
        </Specimen>
      </section>

      {/* --------------------------------------------------------- 6. media */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="06 · Media"
          title="Specimen and media cards"
          description="One media contract for every provider: aspect-[4/3], caption on a bottom gradient, attribution always rendered, badges in the top corners."
        />
        <Specimen label="observation grid · iNaturalist" note="3-up, responsive to 4-up at xl">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {observations.map((record) => (
              <ObservationCard key={record.eventId} record={record} />
            ))}
          </div>
        </Specimen>

        <Specimen label="species grid · eBird / Macaulay" note="4-up, with a regional presence bar">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {media.map((record) => (
              <BirdMediaCard key={record.speciesCode} record={record} />
            ))}
          </div>
        </Specimen>

        <Specimen label="split layout" note="main figure with a 5-column context rail">
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ObservationCard record={observations[0]} />
            </div>
            <div className="grid content-start gap-3 lg:col-span-5">
              <Panel title="Record detail" description={observations[0].observationId.toString()}>
                <dl className="grid gap-2 text-[0.6875rem]">
                  {[
                    { term: "Observed", value: observations[0].observedOn },
                    { term: "Detected", value: formatDate(observations[0].detectedAt) },
                    { term: "Quality", value: observations[0].qualityGrade ?? "—" },
                    { term: "Licence", value: observations[0].photoLicense.toUpperCase() },
                    {
                      term: "Global records",
                      value: observations[0].globalObservationCount?.toString() ?? "—",
                    },
                  ].map((row) => (
                    <div key={row.term} className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">{row.term}</dt>
                      <dd className="truncate font-mono tabular-nums text-foreground">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
              <div className="rounded-lg bg-notable/25 p-3 text-[0.6875rem] text-notable-foreground ring-1 ring-notable/50">
                <strong className="font-medium">Why this record matters.</strong> It is the first verified
                observation of this species in {observations[0].countryName}, so it extends the known
                national range by one species.
              </div>
            </div>
          </div>
        </Specimen>
      </section>

      {/* -------------------------------------------------------- 7. states */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="07 · States"
          title="Loading, empty and error"
          description="Each state is a designed composition with the geometry of the view it replaces, so the page does not reflow when data arrives."
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <Specimen label="state · loading" note="full-page boundary">
            <LoadingState
              title="Checking access…"
              description="Verifying reviewer permissions and loading the private bioacoustics manifest."
            />
          </Specimen>
          <Specimen label="state · empty" note="zero results after filtering">
            <EmptyState
              title="No matching country firsts"
              description="No records matched the current country, taxon and quality filters."
              action={
                <Button variant="outline" size="sm">
                  Reset filters
                </Button>
              }
            />
          </Specimen>
          <Specimen label="state · error" note="recoverable failure">
            <ErrorState
              title="Quiz unavailable"
              description="The recording manifest could not be loaded. The rest of the platform is unaffected."
              action={
                <Button variant="outline" size="sm">
                  <WarningCircleIcon data-icon="inline-start" />
                  Return to bird quiz
                </Button>
              }
            />
          </Specimen>
        </div>
        <Specimen label="state · page skeleton" note="loading.tsx mirrors the real page frame">
          <div className="grid gap-4 rounded-lg bg-card p-4 ring-1 ring-foreground/10" aria-busy="true" aria-label="Loading iNaturalist workspace">
            <div className="grid gap-2 border-b border-border/60 pb-4">
              <span className="h-2.5 w-32 animate-pulse rounded bg-muted" aria-hidden="true" />
              <span className="h-6 w-72 animate-pulse rounded bg-muted" aria-hidden="true" />
              <span className="h-2.5 w-96 max-w-full animate-pulse rounded bg-muted" aria-hidden="true" />
            </div>
            <MetricStripSkeleton count={4} />
            <TableSkeleton rows={4} columns={5} label="Loading records" />
          </div>
        </Specimen>
      </section>

      {/* ---------------------------------------------------- 8. provenance */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="08 · Provenance"
          title="Source strip"
          description="Every data surface ends by naming its artifact, its snapshot and its fetch time. A reviewer should never have to guess how fresh a number is."
        />
        <Specimen label="provenance footer" note="closes every dashboard">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-3 ring-1 ring-foreground/10">
            <div className="grid gap-1">
              <SourceNote>
                iNaturalist country firsts · run{" "}
                <span className="font-mono text-foreground">{inat.publishedRunId}</span> ·{" "}
                {formatNumber(inat.eventCount)} events
              </SourceNote>
              <SourceNote>
                East African bird list · {formatNumber(birds.totalSpecies)} species ·{" "}
                {formatDate(inat.publishedAt)}
              </SourceNote>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">Snapshot, not live</Badge>
              <a href="https://www.inaturalist.org" target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Data courtesy of iNaturalist
                <ArrowSquareOutIcon data-icon="inline-end" />
              </a>
            </div>
          </div>
        </Specimen>
      </section>

      {/* ------------------------------------------------------- 9. density */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="09 · Density"
          title="The compact scale, in one table"
          description="The preset is already compact. These are the rules that keep a page dense without becoming cramped."
        />
        <Panel contentClassName="p-0">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-48">Surface</TableHead>
        <TableHead className="w-72">Utility</TableHead>
        <TableHead>Applied to</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {DENSITY_RULES.map((row) => (
        <TableRow key={row.surface}>
          <TableCell className="font-medium text-foreground">{row.surface}</TableCell>
          <TableCell className="font-mono text-[0.6875rem] text-muted-foreground">
            {row.rule}
          </TableCell>
          <TableCell className="whitespace-normal text-muted-foreground">{row.usage}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
        </Panel>
      </section>
    </PageContainer>
  );
}
