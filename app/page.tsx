import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  CompassIcon,
  CubeIcon,
  PaintBrushIcon,
  RowsIcon,
  RulerIcon,
} from "@phosphor-icons/react/dist/ssr";
import { MriLockup } from "@/components/site/brand";
import { Eyebrow, PageContainer, SectionHeader } from "@/components/mri/layout";
import { MetricCard, MetricStrip, Panel, StatusBadge } from "@/components/mri/patterns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { birds, inat } from "@/lib/data";
import { cn } from "cn";
import { formatCompact, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  // The home route shares its segment with the root layout, so the shared
  // `title.template` does not apply here — set the full title explicitly.
  title: { absolute: "MRI design system" },
  description:
    "A shared MRI interface language: the shadcn preset b6t6Ah1yi plus the page compositions MRI research tools need.",
};

const PRESET_CODE = "b6t6Ah1yi";

const PRESET_VALUES: { key: string; value: string; note: string }[] = [
  { key: "style", value: "mira", note: "Component style and spacing rhythm" },
  { key: "theme", value: "green", note: "Primary colour family" },
  { key: "baseColor", value: "olive", note: "Neutral surfaces and borders" },
  { key: "chartColor", value: "olive", note: "Monochrome chart ramp (chart-1 … chart-5)" },
  { key: "radius", value: "default", note: "0.625rem base with a proportional scale" },
  { key: "font", value: "inter", note: "Mapped to --font-sans" },
  { key: "fontHeading", value: "inherit", note: "Headings reuse the sans stack" },
  { key: "iconLibrary", value: "phosphor", note: "@phosphor-icons/react" },
  { key: "menuColor / menuAccent", value: "default / subtle", note: "Menu chrome treatment" },
];

const SECTIONS = [
  {
    href: "/rules",
    icon: RulerIcon,
    title: "Rules",
    description:
      "The three rules that force consistency rather than describing it: how space is spent, how chips are sized, and how text sits on a photograph.",
    meta: "8 space steps · 1 chip · 4 overlay rules",
  },
  {
    href: "/foundations",
    icon: PaintBrushIcon,
    title: "Foundations",
    description:
      "The preset’s colour roles, type scale, radii and icon rules — plus the MRI mark on light and dark surfaces.",
    meta: "9 colour roles · 5 chart steps · 5 radii",
  },
  {
    href: "/components",
    icon: CubeIcon,
    title: "Components",
    description:
      "Every shadcn primitive the template installs, exactly as the preset generates it. Copy-paste fidelity, no local restyling.",
    meta: "37 primitives installed",
  },
  {
    href: "/charts",
    icon: ChartLineUpIcon,
    title: "Charts",
    description:
      "Area, bar, grouped bar, line and donut built on ChartContainer and Recharts, using the olive chart ramp.",
    meta: "Recharts 3 · 5 chart types",
  },
  {
    href: "/patterns",
    icon: RowsIcon,
    title: "Page patterns",
    description:
      "The higher-level concepts: page headers, metric strips, panels, data-card headers, tables, media cards and data states.",
    meta: "3 rule sets · 12 compositions",
  },
];

const PRINCIPLES = [
  {
    title: "Semantic tokens only",
    body: "Routes consume bg-background, text-muted-foreground, ring-foreground/10 and the chart ramp. No new global variables, no hard-coded hex, no route-level CSS files.",
  },
  {
    title: "One type scale",
    body: "Inter everywhere; headings use font-heading at font-medium. Body copy stays at text-xs/relaxed, and text-sm is reserved for titles so a row of cards reads as one band.",
  },
  {
    title: "Compact, data-first density",
    body: "Numbers drive the layout: right-aligned, tabular, monospace counts, and tables tuned for above-the-fold data rather than generous whitespace.",
  },
  {
    title: "Colour is the last resort",
    body: "The preset’s chart ramp is monochrome olive, so charts cap at three series and pair every shade with a label. Status colour comes from badge variants.",
  },
  {
    title: "One media contract",
    body: "Photographs are aspect-[4/3] with the caption on a bottom gradient and attribution always present. The same card geometry carries observations, audio and video.",
  },
  {
    title: "States are designed, not defaulted",
    body: "Loading, empty and error states are first-class compositions sharing the geometry of the populated view, so nothing jumps when data arrives.",
  },
];

const REFERENCE_PAGES = [
  { href: "/pages/platform", label: "Platform home", detail: "Weekly watches + field tools" },
  { href: "/pages/inaturalist", label: "iNaturalist watch", detail: "Country-first audit" },
  { href: "/pages/ebird", label: "eBird & Macaulay", detail: "Regional media dashboard" },
  { href: "/pages/xeno-canto", label: "Xeno-canto watch", detail: "Bioacoustic snapshot" },
  { href: "/pages/quiz", label: "Bird sound quiz", detail: "Audio practice states" },
];

export default function OverviewPage() {
  const latest = inat.latestRun;

  return (
    <PageContainer size="wide">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-4">
          <MriLockup />

          <div className="grid gap-3">
            <Eyebrow>Maiyo Research Institute · Shared interface language</Eyebrow>
            <h1 className="text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              One design system for every MRI research tool.
            </h1>
            <p className="max-w-3xl text-pretty text-sm/relaxed text-muted-foreground">
              The platform’s CSS grew by hand, one route at a time. This template replaces that with the
              shadcn preset exactly as published, then layers the page-level concepts MRI projects actually
              need — dashboards, catalogues, media grids and practice tools — on top of it. Everything on
              this site is a real composition filled with real platform data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge tone="positive">
              <CheckCircleIcon className="size-3" weight="fill" />
              Preset {PRESET_CODE}
            </StatusBadge>
            <Badge variant="outline">style mira</Badge>
            <Badge variant="outline">Base UI primitives</Badge>
            <Badge variant="outline">Tailwind v4</Badge>
            <Badge variant="outline">Next.js 16</Badge>
            <Badge variant="outline">Light + dark</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/patterns" className={buttonVariants({ size: "lg" })}>
              Review the page patterns
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <Link href="/foundations" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Start with the foundations
            </Link>
          </div>
        </div>

        <Panel
          title="Sampled from the live platform"
          description="Every figure below is read from platform artifacts, not invented."
          footer={
            <span className="block truncate font-mono text-[0.625rem]">{inat.source}</span>
          }
        >
          <dl className="grid gap-3">
            {[
              {
                label: "Regional checklist",
                value: `${formatNumber(birds.totalSpecies)} species`,
                detail: `${birds.familyCount} families · ${birds.countries.length} nations`,
              },
              {
                label: "Weekly watch scope",
                value: `${inat.countries.length} countries`,
                detail: `${formatNumber(inat.eventCount)} country-first records`,
              },
              {
                label: "Bioacoustic coverage",
                value: `${formatCompact(birds.xeno.totals.recordings)} calls`,
                detail: `${formatNumber(birds.xeno.totals.speciesWithAudio)} species with audio`,
              },
              {
                label: "Latest scan",
                value: latest ? `${latest.newCount} new` : "—",
                detail: latest ? `${formatNumber(latest.recheckedCount)} records rechecked` : "—",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0"
              >
                <dt className="text-[0.6875rem] text-muted-foreground">{row.label}</dt>
                <dd className="text-right">
                  <span className="block text-sm font-medium tabular-nums text-foreground">
                    {row.value}
                  </span>
                  <span className="block text-[0.625rem] text-muted-foreground">{row.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="The baseline"
          title="What the preset gives us, unchanged"
          description="These are the decoded preset values. The template applies them verbatim — nothing is overridden and no MRI-specific theme layer sits on top."
        />
        <Panel
          title={`shadcn preset ${PRESET_CODE}`}
          description="Decoded with `npx shadcn@latest preset decode b6t6Ah1yi`"
          action={
            <a
              href={`https://ui.shadcn.com/create?preset=${PRESET_CODE}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Open in shadcn
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          }
          contentClassName="grid gap-4"
        >
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-52">Preset key</TableHead>
        <TableHead className="w-48">Value</TableHead>
        <TableHead>What it controls</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {PRESET_VALUES.map((row) => (
        <TableRow key={row.key}>
          <TableCell className="font-mono text-[0.6875rem] text-muted-foreground">
            {row.key}
          </TableCell>
          <TableCell className="font-mono text-[0.6875rem] font-medium text-foreground">
            {row.value}
          </TableCell>
          <TableCell className="whitespace-normal text-muted-foreground">
            {row.note}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

          <div className="rounded-lg bg-muted/40 p-3">
            <p className="mb-1.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Adopting it in another MRI project
            </p>
            <pre className="overflow-x-auto font-mono text-[0.6875rem] leading-relaxed text-foreground">
              {`# new project
npx shadcn@latest init --preset ${PRESET_CODE} --template next

# existing project — theme and fonts only
npx shadcn@latest apply ${PRESET_CODE} --only theme
npx shadcn@latest apply ${PRESET_CODE} --only font`}
            </pre>
          </div>
        </Panel>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="What is in the box"
          title="Five layers, in review order"
          description="Rules, foundations and components are the contract. Charts and page patterns are the MRI compositions other projects inherit."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((section, index) => (
            <Card
              key={section.href}
              className={cn(
                "group transition-colors hover:ring-primary/30",
                index === 0 && "sm:col-span-2",
              )}
            >
              <CardHeader className="grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary-ink">
                  <section.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <CardTitle>{section.title}</CardTitle>
                  <p className="mt-0.5 font-mono text-[0.625rem] text-muted-foreground">
                    {section.meta}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-xs/relaxed text-muted-foreground">{section.description}</p>
                <Link href={section.href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}>
                  Open {section.title.toLowerCase()}
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Reference pages"
          title="Five live routes, rebuilt"
          description="Each is a real MRI screen reduced to its composition: the same data, cards, charts and table geometry, on the preset."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {REFERENCE_PAGES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group grid content-start gap-1 rounded-lg bg-card p-3 ring-1 ring-foreground/10 transition-colors hover:ring-primary/30"
            >
              <span className="flex items-center justify-between gap-2">
                <RowsIcon className="size-3.5 text-muted-foreground" />
                <ArrowUpRightIcon className="size-3 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
              <span className="font-heading text-xs/relaxed font-medium text-foreground">
                {item.label}
              </span>
              <span className="text-[0.625rem] text-muted-foreground">{item.detail}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="House rules"
          title="Six principles the template encodes"
          description="These are the rules that keep routes consistent without a design review per route."
        />
        <MetricStrip label="Template principles">
          <MetricCard
            label="Colour roles"
            value="9"
            detail="Surfaces, text, borders and status"
            icon={<PaintBrushIcon className="size-3" />}
          />
          <MetricCard
            label="Chart steps"
            value="5"
            detail="Monochrome olive ramp"
            icon={<ChartLineUpIcon className="size-3" />}
          />
          <MetricCard
            label="Icon set"
            value="1"
            detail="Phosphor, from the RSC-safe entry"
            icon={<CubeIcon className="size-3" />}
          />
          <MetricCard
            label="Custom CSS files"
            value="0"
            detail="Tokens and utilities only"
            icon={<CompassIcon className="size-3" />}
          />
        </MetricStrip>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((principle, index) => (
            <Panel key={principle.title} size="sm">
              <div className="grid gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.625rem] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-xs/relaxed font-medium text-foreground">
                    {principle.title}
                  </h3>
                </div>
                <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                  {principle.body}
                </p>
              </div>
            </Panel>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
