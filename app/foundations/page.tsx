import type { Metadata } from "next";
import {
  BookOpenIcon,
  CameraIcon,
  ChartBarIcon,
  CompassIcon,
  DatabaseIcon,
  FireIcon,
  GlobeIcon,
  HeadphonesIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MicrophoneIcon,
  SealCheckIcon,
  SparkleIcon,
  TreeIcon,
  WarningCircleIcon,
  WaveformIcon,
} from "@phosphor-icons/react/dist/ssr";
import { MriLockup, MriMark, MriMarkInverse, ProviderMark } from "@/components/site/brand";
import { PageContainer, PageHeader, SectionHeader, Specimen } from "@/components/mri/layout";
import { Panel, StatusBadge } from "@/components/mri/patterns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "cn";
import { FONT_OPTIONS } from "@/lib/font-preference";

export const metadata: Metadata = {
  title: "Foundations",
  description:
    "The preset's colour roles, chart ramp, type scale, radii and iconography — plus the MRI mark on light and dark surfaces.",
};

interface TokenRow {
  name: string;
  value: string;
  light: string;
  usage: string;
  onDark?: boolean;
}

const SURFACE_TOKENS: TokenRow[] = [
  { name: "--background", value: "oklch(1 0 0)", light: "var(--background)", usage: "Page canvas", onDark: true },
  { name: "--card", value: "oklch(1 0 0)", light: "var(--card)", usage: "Panels, tables, metric cards", onDark: true },
  { name: "--popover", value: "oklch(1 0 0)", light: "var(--popover)", usage: "Menus, dialogs, tooltips", onDark: true },
  { name: "--muted", value: "oklch(0.966 0.005 106.5)", light: "var(--muted)", usage: "Recessed rows, wells, hover fills" },
  { name: "--secondary", value: "oklch(0.967 0.001 286.375)", light: "var(--secondary)", usage: "Secondary buttons and badges" },
  { name: "--accent", value: "oklch(0.966 0.005 106.5)", light: "var(--accent)", usage: "Hover surfaces for menus and rows" },
];

const INK_TOKENS: TokenRow[] = [
  { name: "--primary", value: "oklch(0.527 0.154 150.069)", light: "var(--primary)", usage: "Actions, active state, positive data" },
  { name: "--foreground", value: "oklch(0.153 0.006 107.1)", light: "var(--foreground)", usage: "Primary text and headings" },
  { name: "--muted-foreground", value: "oklch(0.58 0.031 107.3)", light: "var(--muted-foreground)", usage: "Descriptions, labels, axes" },
  { name: "--border", value: "oklch(0.93 0.007 106.5)", light: "var(--border)", usage: "Dividers, table rules, panel rings" },
  { name: "--input", value: "oklch(0.93 0.007 106.5)", light: "var(--input)", usage: "Field borders" },
  { name: "--ring", value: "oklch(0.58 0.021 106.9)", light: "var(--ring)", usage: "Focus rings" },
  { name: "--destructive", value: "oklch(0.577 0.245 27.325)", light: "var(--destructive)", usage: "Errors, missed quiz answers, withdrawals" },
];

const SEMANTIC_TOKENS: TokenRow[] = [
  {
    name: "--info",
    value: "oklch(0.52 0.15 252) · dark oklch(0.75 0.12 250)",
    light: "var(--info)",
    usage: "Provenance and context: where a number came from, what kind of media this is",
  },
  {
    name: "--info-ink",
    value: "oklch(0.47 0.15 252) · dark oklch(0.79 0.11 250)",
    light: "var(--info-ink)",
    usage: "--info as text on a tinted chip or a page surface",
  },
  {
    name: "--warning",
    value: "oklch(0.62 0.14 62) · dark oklch(0.8 0.13 75)",
    light: "var(--warning)",
    usage: "At-risk taxa, needs-review records, near-threshold values",
  },
  {
    name: "--warning-ink",
    value: "oklch(0.48 0.12 60) · dark oklch(0.84 0.12 78)",
    light: "var(--warning-ink)",
    usage: "--warning as text on a tinted chip or a page surface",
  },
  {
    name: "--notable",
    value: "oklch(0.79 0.15 80) · dark oklch(0.84 0.14 83)",
    light: "var(--notable)",
    usage: "Rarity, as a fill. Carries --notable-foreground, a dark ink",
  },
  {
    name: "--notable-ink",
    value: "oklch(0.45 0.09 62) · dark oklch(0.87 0.13 82)",
    light: "var(--notable-ink)",
    usage: "--notable as text on a tinted chip or a page surface",
  },
  {
    name: "--primary-ink",
    value: "oklch(0.47 0.13 151) · dark oklch(0.8 0.15 152)",
    light: "var(--primary-ink)",
    usage: "Eyebrows, links and positive chips — the preset's --primary is a fill",
  },
  {
    name: "--destructive-ink",
    value: "oklch(0.47 0.19 27) · dark oklch(0.76 0.15 25)",
    light: "var(--destructive-ink)",
    usage: "Withdrawn and error text on a tinted chip or a page surface",
  },
];

const CHART_TOKENS: TokenRow[] = [
  { name: "--chart-1", value: "oklch(0.88 0.011 106.6)", light: "var(--chart-1)", usage: "Lightest step — area fills, backgrounds" },
  { name: "--chart-2", value: "oklch(0.58 0.031 107.3)", light: "var(--chart-2)", usage: "Third series, warning accents" },
  { name: "--chart-3", value: "oklch(0.466 0.025 107.3)", light: "var(--chart-3)", usage: "Second series, comparison bars" },
  { name: "--chart-4", value: "oklch(0.394 0.023 107.4)", light: "var(--chart-4)", usage: "Primary series, strongest emphasis" },
  { name: "--chart-5", value: "oklch(0.286 0.016 107.4)", light: "var(--chart-5)", usage: "Darkest step — outlines, labels" },
];

const TYPE_SCALE = [
  {
    name: "Page title",
    className: "font-heading text-2xl font-medium tracking-tight sm:text-3xl",
    sample: "East Africa biodiversity updates",
    spec: "font-heading · text-2xl → 3xl · font-medium · tracking-tight",
  },
  {
    name: "Section title",
    className: "font-heading text-base font-medium tracking-tight sm:text-lg",
    sample: "What changed across East Africa",
    spec: "font-heading · text-base → lg · font-medium",
  },
  {
    name: "Card title",
    className: "font-heading text-sm font-medium",
    sample: "National catalog distribution (9)",
    spec: "font-heading · text-sm · font-medium",
  },
  {
    name: "Body",
    className: "text-xs/relaxed text-muted-foreground sm:text-sm/relaxed",
    sample:
      "Each week MRI reviews public biodiversity records to identify species newly recorded in an East African country.",
    spec: "text-xs/relaxed → sm:text-sm/relaxed · text-muted-foreground",
  },
  {
    name: "Caption",
    className: "text-[0.6875rem] text-muted-foreground",
    sample: "Updated 13 Sep 2026 · 96 requests · 399 records rechecked",
    spec: "text-[0.6875rem] · text-muted-foreground",
  },
  {
    name: "Eyebrow",
    className: "text-[0.625rem] font-medium uppercase tracking-[0.14em] text-primary-ink",
    sample: "Maiyo Research Institute · Biodiversity intelligence",
    spec: "text-[0.625rem] · uppercase · tracking-[0.14em]",
  },
  {
    name: "Metric value",
    className: "text-xl font-medium tabular-nums",
    sample: "1,706",
    spec: "text-xl · font-medium · tabular-nums (sans, not mono)",
  },
  {
    name: "Identifier",
    className: "font-mono text-[0.6875rem] text-muted-foreground",
    sample: "inat-20260913 · afpfly1",
    spec: "font-mono · text-[0.6875rem] — the only place mono is used",
  },
  {
    name: "Taxon",
    className: "font-serif text-xs italic text-muted-foreground",
    sample: "Terpsiphone viridis",
    spec: "font-serif · italic",
  },
];

const RADII = [
  { token: "--radius-sm", value: "calc(0.625rem × 0.6) = 6px", class: "rounded-sm" },
  { token: "--radius-md", value: "calc(0.625rem × 0.8) = 8px", class: "rounded-md" },
  { token: "--radius-lg", value: "0.625rem = 10px", class: "rounded-lg" },
  { token: "--radius-xl", value: "calc(0.625rem × 1.4) = 14px", class: "rounded-xl" },
  { token: "--radius-2xl", value: "calc(0.625rem × 1.8) = 18px", class: "rounded-2xl" },
  { token: "--radius-3xl", value: "calc(0.625rem × 2.2) = 22px", class: "rounded-3xl" },
];

const ICONS = [
  { icon: CompassIcon, name: "Compass", use: "Scope and programme" },
  { icon: DatabaseIcon, name: "Database", use: "Catalogue and records" },
  { icon: ChartBarIcon, name: "ChartBar", use: "Series and coverage" },
  { icon: WaveformIcon, name: "Waveform", use: "Bioacoustics" },
  { icon: HeadphonesIcon, name: "Headphones", use: "Quiz and playback" },
  { icon: MicrophoneIcon, name: "Microphone", use: "Recording counts" },
  { icon: CameraIcon, name: "Camera", use: "Photo counts" },
  { icon: GlobeIcon, name: "Globe", use: "Country coverage" },
  { icon: MapPinIcon, name: "MapPin", use: "Place and site" },
  { icon: TreeIcon, name: "Tree", use: "Habitat and taxa" },
  { icon: BookOpenIcon, name: "BookOpen", use: "Checklists" },
  { icon: SealCheckIcon, name: "SealCheck", use: "Verification" },
  { icon: FireIcon, name: "Fire", use: "Streaks" },
  { icon: MagnifyingGlassIcon, name: "MagnifyingGlass", use: "Search" },
  { icon: WarningCircleIcon, name: "WarningCircle", use: "Errors" },
  { icon: SparkleIcon, name: "Sparkle", use: "Highlights" },
];

function Swatch({ token, size = "size-9" }: { token: string; size?: string }) {
  return (
    <span
      className={cn("block shrink-0 rounded-md ring-1 ring-foreground/10", size)}
      style={{ backgroundColor: `var(${token})` }}
      aria-hidden="true"
    />
  );
}

export default function FoundationsPage() {
  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Foundations"
        title="Tokens, type and marks"
        description="Everything here comes straight from the preset's generated stylesheet. The only MRI addition is the brand mark, prepared as a transparent lockup so it sits on any surface."
        status={
          <>
            <StatusBadge tone="positive">Generated, not hand-tuned</StatusBadge>
            <Badge variant="outline">globals.css · 129 lines</Badge>
          </>
        }
      />

      {/* ------------------------------------------------------------- brand */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Brand"
          title="The MRI mark"
          description="The published artwork is a flat cream plate. The template ships a knocked-out version (background removed by alpha unmixing) plus a white knockout for dark mode."
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <Panel title="Full lockup" description="Hero and footer treatments" className="lg:col-span-2">
            <div className="grid gap-3">
              <div className="grid place-items-center rounded-lg bg-background p-6 ring-1 ring-foreground/10">
                <MriLockup />
              </div>
              <div className="grid place-items-center rounded-lg bg-foreground p-6">
                <img
                  src="/brand/mri-logo-inverse.png"
                  alt="MRI lockup reversed out on a dark surface"
                  width={758}
                  height={513}
                  className="h-20 w-auto object-contain"
                />
              </div>
              <p className="text-[0.6875rem] text-muted-foreground">
                <code className="font-mono">public/brand/mri-logo.png</code> · 758×513 · transparent ·
                dark-mode variant <code className="font-mono">mri-logo-inverse.png</code>
              </p>
            </div>
          </Panel>

          <Panel title="Emblem" description="Header, favicon, compact contexts">
            <div className="grid gap-3">
              <div className="flex items-end justify-center gap-4 rounded-lg bg-muted/40 p-4">
                {[16, 24, 32, 48].map((size) => (
                  <span key={size} className="grid justify-items-center gap-1.5">
                    <MriMark size={size} />
                    <MriMarkInverse size={size} />
                    <span className="font-mono text-[0.5625rem] text-muted-foreground">{size}px</span>
                  </span>
                ))}
              </div>
              <div className="grid gap-1.5 text-[0.6875rem] text-muted-foreground">
                <p>
                  Minimum size <strong className="text-foreground">16px</strong>. Below that the circuit
                  traces in the emblem close up.
                </p>
                <p>
                  Clear space of <strong className="text-foreground">0.5×</strong> the emblem height on all
                  sides. Never recolour, rotate or add a plate behind it.
                </p>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title="Provider marks" description="Constant optical size, desaturated in dark mode">
          <div className="flex flex-wrap items-center gap-4">
            {[
              { src: "/providers/inaturalist.png", alt: "iNaturalist" },
              { src: "/providers/ebird.png", alt: "eBird" },
              { src: "/providers/gbif.png", alt: "GBIF" },
              { src: "/providers/xeno-canto.png", alt: "Xeno-canto" },
              { src: "/providers/avilist.png", alt: "AviList" },
              { src: "/providers/birdlife.png", alt: "BirdLife International" },
              { src: "/providers/wikipedia.png", alt: "Wikipedia" },
            ].map((provider) => (
              <span key={provider.alt} className="grid justify-items-center gap-1.5">
                <ProviderMark src={provider.src} alt={provider.alt} className="size-7" />
                <span className="text-[0.5625rem] text-muted-foreground">{provider.alt}</span>
              </span>
            ))}
          </div>
        </Panel>
      </section>

      {/* ------------------------------------------------------------ colour */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Colour"
          title="Semantic roles, never raw hex"
          description="Routes reference roles, not values. That is what makes a preset swap a one-line change instead of a route-by-route rewrite."
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Surfaces" description="Layered neutrals from the olive base colour">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Token</TableHead>
                  <TableHead>Used for</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SURFACE_TOKENS.map((token) => (
                  <TableRow key={token.name}>
                    <TableCell>
                      <Swatch token={token.name} />
                    </TableCell>
                    <TableCell className="font-mono text-[0.6875rem] text-foreground">
                      {token.name}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {token.usage}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <Panel title="Ink and structure" description="Text, borders, focus and destructive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Token</TableHead>
                  <TableHead>Used for</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INK_TOKENS.map((token) => (
                  <TableRow key={token.name}>
                    <TableCell>
                      <Swatch token={token.name} />
                    </TableCell>
                    <TableCell className="font-mono text-[0.6875rem] text-foreground">
                      {token.name}
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {token.usage}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        <Panel
          title="MRI semantic extension"
          description="The state roles the preset does not ship, plus the readable ink tier — defined once in app/mri-theme.css"
          action={<Badge variant="outline">portable</Badge>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Token</TableHead>
                <TableHead>Light / dark value</TableHead>
                <TableHead>Used for</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SEMANTIC_TOKENS.map((token) => (
                <TableRow key={token.name}>
                  <TableCell>
                    <Swatch token={token.name} />
                  </TableCell>
                  <TableCell className="font-mono text-[0.6875rem] text-foreground">
                    {token.name}
                  </TableCell>
                  <TableCell className="font-mono text-[0.5625rem] text-muted-foreground">
                    {token.value}
                  </TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">
                    {token.usage}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <Panel
          title="Chart ramp"
          description="chartColor: olive produces a monochrome ramp, not five hues — this is the single most important consequence of the preset"
          action={<Badge variant="outline">review point</Badge>}
        >
          <div className="grid gap-4">
            <div className="grid grid-cols-5 gap-2">
              {CHART_TOKENS.map((token) => (
                <div key={token.name} className="grid gap-1.5">
                  <span
                    className="block h-16 rounded-md ring-1 ring-foreground/10"
                    style={{ backgroundColor: `var(${token.name})` }}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[0.625rem] text-foreground">{token.name}</span>
                  <span className="text-[0.5625rem] leading-tight text-muted-foreground">
                    {token.usage}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">What this means for charts.</strong> Five series cannot be
              told apart by colour alone, so every chart in this template caps at three series, orders them
              darkest-first, and always ships a labelled legend. If MRI wants categorical colour, the
              change is one preset value (<code className="font-mono">chartColor</code>), not per-chart
              overrides.
            </div>
          </div>
        </Panel>
      </section>

      {/* ------------------------------------------------------------ fonts */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Fonts"
          title="Inter renders, Atkinson is the fallback"
          description="The preset specifies font: inter and nothing else, so Inter is what every page renders. Atkinson Hyperlegible is loaded as the legibility fallback — offered in the picker, never the default — alongside three general alternatives. Monospace is not a webfont: it is the platform's system stack, used only for codes, ids, dates and paths."
        />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Panel title="In use" description="What every page renders unless you change it" contentClassName="grid gap-3">
            <div className="grid gap-1.5">
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Sans · Inter
              </p>
              <p className="text-lg text-foreground">
                Species documented per country
              </p>
              <p className="text-xs/relaxed text-muted-foreground">
                Preset <code className="font-mono">font: inter</code> · platform default ·{' '}
                <code className="font-mono">--font-inter</code>
              </p>
            </div>
            <div className="grid gap-1.5 border-t border-border/60 pt-3">
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Mono · system stack
              </p>
              <p className="font-mono text-sm text-foreground">inat-20260913 · afpfly1 · 2025-12-24</p>
              <p className="text-xs/relaxed text-muted-foreground">
                <code className="font-mono">ui-monospace, SFMono-Regular, Menlo …</code> — no download, and
                the same stack the live platform uses.
              </p>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">The rule.</strong> Anything that measures something — a
              count, a score, a percentage, a species total — is Inter with{' '}
              <code className="font-mono">tabular-nums</code>. Monospace is only for strings you would
              copy or compare character by character.
            </div>
          </Panel>

          <Panel
            title="Shortlist for review"
            description="Switch live from the header picker; each option is previewed in its own face"
            action={<Badge variant="outline">Preview only</Badge>}
            contentClassName="grid gap-0"
          >
            <div className="grid gap-0 divide-y divide-border/60">
              {FONT_OPTIONS.map((option) => (
                <div key={option.key} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {option.label}
                      {option.current ? <span className="ml-2 text-primary-ink">· platform</span> : null}
                    </span>
                    <code className="font-mono text-[0.5625rem] text-muted-foreground">
                      {option.variable}
                    </code>
                  </div>
                  <p
                    className="text-base text-foreground"
                    style={{ fontFamily: `var(${option.variable})` }}
                  >
                    Which species are new to each country? 1,706 · 8 nations
                  </p>
                  <p className="text-[0.6875rem] text-muted-foreground">{option.note}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {/* -------------------------------------------------------- typography */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Typography"
          title="One scale, one family"
          description="Inter carries everything — headings included (fontHeading: inherit). Counts use Inter with tabular-nums; monospace is reserved for codes, ids, dates and paths. Switch the family from the header to compare alternatives."
        />
        <Panel contentClassName="grid gap-0">
          <div className="grid gap-0 divide-y divide-border/60">
            {TYPE_SCALE.map((row) => (
              <div key={row.name} className="grid gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {row.name}
                  </span>
                  <code className="font-mono text-[0.5625rem] text-muted-foreground">{row.spec}</code>
                </div>
                <p className={cn("text-foreground", row.className)}>{row.sample}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* ------------------------------------------------------------ radius */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Shape"
          title="Radius scale"
          description="The preset keeps radius: default (0.625rem) and derives every step proportionally, so raising the base rounds the whole interface at once."
        />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {RADII.map((radius) => (
            <div key={radius.token} className="grid gap-2">
              <span
                className={cn("block h-16 bg-primary/15 ring-1 ring-primary/25", radius.class)}
                aria-hidden="true"
              />
              <span className="font-mono text-[0.625rem] text-foreground">{radius.token}</span>
              <span className="text-[0.5625rem] text-muted-foreground">{radius.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ icons */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Iconography"
          title="Phosphor, one weight per role"
          description="Imported from @phosphor-icons/react/dist/ssr so server and client render the same markup. Regular for chrome, bold or fill for emphasis."
        />
        <Panel contentClassName="grid gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {ICONS.map((entry) => (
              <div
                key={entry.name}
                className="grid justify-items-center gap-1.5 rounded-md bg-muted/40 p-3 text-center"
              >
                <entry.icon className="size-4 text-foreground" />
                <span className="font-mono text-[0.5625rem] text-foreground">{entry.name}</span>
                <span className="text-[0.5625rem] leading-tight text-muted-foreground">{entry.use}</span>
              </div>
            ))}
          </div>
          <p className="text-[0.6875rem] text-muted-foreground">
            Sizes are literal utilities rather than arbitrary values:{" "}
            <code className="font-mono">size-3</code> inline with text,{" "}
            <code className="font-mono">size-3.5</code> inside buttons and badges,{" "}
            <code className="font-mono">size-4</code> standalone,{" "}
            <code className="font-mono">size-5</code> page-level feature icons.
          </p>
        </Panel>
      </section>

      <Specimen
        label="elevation"
        note="The preset uses rings, not drop shadows — one less thing to theme"
        contentClassName="grid gap-3 sm:grid-cols-3"
      >
        <Card>
          <CardContent className="grid gap-1">
            <p className="font-heading text-xs/relaxed font-medium">Card default</p>
            <p className="text-[0.6875rem] text-muted-foreground">
              <code className="font-mono">ring-1 ring-foreground/10</code>
            </p>
          </CardContent>
        </Card>
        <Card className="ring-primary/30">
          <CardContent className="grid gap-1">
            <p className="font-heading text-xs/relaxed font-medium">Interactive hover</p>
            <p className="text-[0.6875rem] text-muted-foreground">
              <code className="font-mono">ring-primary/30</code>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardContent className="grid gap-1">
            <p className="font-heading text-xs/relaxed font-medium">Overlay only</p>
            <p className="text-[0.6875rem] text-muted-foreground">
              Popovers, sheets and toast — never in the page flow
            </p>
          </CardContent>
        </Card>
      </Specimen>
    </PageContainer>
  );
}
