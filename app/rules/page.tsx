import type { Metadata } from "next";
import {
  CameraIcon,
  CheckIcon,
  GlobeIcon,
  HeadphonesIcon,
  ImageSquareIcon,
  SealCheckIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ChipAudit } from "@/components/mri/chip-audit";
import { Chip, ChipRow, OverlayCaption } from "@/components/mri/chips";
import { IucnChip } from "@/components/mri/specimen-card";
import { PageContainer, PageHeader, SectionHeader, Specimen } from "@/components/mri/layout";
import { Panel, StatusBadge, TableCard } from "@/components/mri/patterns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "cn";

export const metadata: Metadata = {
  title: "Rules",
  description:
    "The three rules the template enforces: how space is spent, how chips are sized, and how text sits on a photograph.",
};

const SPACE_SCALE = [
  { step: "0.5", value: "2px", utility: "gap-0.5", role: "Glyph to glyph inside a chip" },
  { step: "1", value: "4px", utility: "gap-1", role: "Icon to label inside a control" },
  { step: "1.5", value: "6px", utility: "gap-1.5", role: "Chip to chip in a row" },
  { step: "2", value: "8px", utility: "gap-2", role: "Stacked text lines; label to value" },
  { step: "3", value: "12px", utility: "gap-3 · --card-spacing", role: "Card padding; card-grid gutter; inside a block" },
  { step: "4", value: "16px", utility: "gap-4", role: "Panel padding; gutter for large blocks" },
  { step: "6", value: "24px", utility: "gap-6", role: "Section heading to its content" },
  { step: "10", value: "40px", utility: "gap-10", role: "Between page sections" },
];

/** Control geometry — fixed sizes that are not layout rhythm, each with a reason. */
const SPACE_EXCEPTIONS = [
  { token: "pl-7 / pl-8", why: "a search input clearing its 14px icon and that icon's inset" },
  { token: "pr-7 / pr-8", why: "an input clearing a trailing affordance — a clear button or a select caret" },
  { token: "px-8", why: "the desktop page gutter, matching the live platform" },
  { token: "pr-14", why: "a sheet header making room for its close button" },
];

const SPACE_RULES = [
  {
    title: "Nothing is flush",
    body: "Every content edge keeps at least --card-spacing. The only exception is a photograph bleeding to a card's top, left and right edges.",
    was: "Media cards had 0px below their last row.",
  },
  {
    title: "A card body is exactly --card-spacing on all four sides",
    body: "Never zero, never mixed, never one axis. If the card is p-0 for a bleeding image, the body re-applies the same value on the other three edges.",
    was: "p-(--card-spacing) silently never compiled, so bodies got horizontal padding only.",
  },
  {
    title: "One gutter: 12px",
    body: "Card grids use gap-3. gap-3 is not available. Full-width page blocks may use 16px, and nothing else.",
    was: "Metric strips used gap-3 while everything else used gap-3.",
  },
  {
    title: "A card sizes to its content",
    body: "A flex column never distributes slack with justify-between. Dead space in a card means the content is wrong, not that the padding needs to grow.",
    was: "The quiz hero used content-between and stretched three blocks across a tall column.",
  },
  {
    title: "Section rhythm is 40 / 24 / 12",
    body: "40px between sections, 24px from a section heading to its content, 12px inside a block. There is no fourth value.",
    was: "Sections used 8, 10, 24 and 40 inconsistently.",
  },
  {
    title: "Media has a fixed ratio, text does not drive height",
    body: "Photographs are aspect-[4/3]. A card's height comes from its media plus its real content, never from padding added to fill a row.",
    was: "Grid rows stretched shorter cards to match the tallest.",
  },
];

const CHIP_TONES = [
  { tone: "neutral", use: "Counts, labels, filters that are off" },
  { tone: "primary", use: "The one action or selected filter on a surface" },
  { tone: "positive", use: "Verified, stable, passing" },
  { tone: "info", use: "Provenance and context — neither good nor bad news" },
  { tone: "warning", use: "At-risk, needs review, near threshold" },
  { tone: "notable", use: "Rarity. At most one per screen" },
  { tone: "negative", use: "Withdrawn, failed, error" },
] as const;

/** The extension roles, shown with the exact values they resolve to. */
const SEMANTIC_ROLES = [
  {
    token: "--info",
    tone: "info" as const,
    label: "Field audio",
    light: "oklch(0.52 0.15 252)",
    dark: "oklch(0.75 0.12 250)",
    use: "Provenance and context that is neither good nor bad news — where a number came from, what kind of media this is.",
  },
  {
    token: "--warning",
    tone: "warning" as const,
    label: "Near Threatened",
    light: "oklch(0.56 0.13 62)",
    dark: "oklch(0.8 0.13 75)",
    use: "At-risk taxa, needs-review records, near-threshold values. Dark enough to be read as text, not only used as a fill.",
  },
  {
    token: "--notable",
    tone: "notable" as const,
    label: "Global first",
    light: "oklch(0.79 0.15 80)",
    dark: "oklch(0.84 0.14 83)",
    use: "Rarity. A gold fill with a dark ink, which is the only pairing that stays legible on top of an arbitrary photograph.",
  },
];

const OVERLAY_RULES = [
  {
    title: "Every chip on a photograph carries its own scrim",
    body: "A chip over an image is read against unknown contrast, so the overlay surface forces an opaque-enough background: black/70 with white, or background/90 with foreground. A tinted or outline chip may never be placed on a photograph.",
    was: "The IUCN “LC” chip used variant=\"outline\" — a transparent background — and vanished on pale images.",
  },
  {
    title: "At most two chips, one per top corner",
    body: "A third chip means the image is carrying data that belongs in the card body. The rule is enforced in ChipRow with a development warning.",
    was: "iNaturalist cards carried up to three chips and the card body repeated two of them.",
  },
  {
    title: "Media facts on the image, record facts in the body",
    body: "Where it was seen and how rare it is are properties of the photograph and belong on it. Verification status, IUCN category, counts and dates are properties of the record — they go where the background is known.",
    was: "Stable, Global First and the country all competed on the image, while the body repeated them.",
  },
  {
    title: "Attribution is always a bottom gradient",
    body: "Never bare text on a photograph. from-black/80 via-black/45, minimum 32px tall, white/85 text, truncated to one line.",
    was: "Attribution was consistent already — this one is unchanged.",
  },
];

export default function RulesPage() {
  return (
    <PageContainer size="wide" className="grid gap-10 py-10 sm:py-10">
      <PageHeader
        eyebrow="Rules"
        title="Three rules, enforced rather than described"
        description="A design system is not a palette and a component list. It is the small number of decisions a route author is not allowed to make again. These are ours: how space is spent, how chips are sized, and how text sits on a photograph."
        status={
          <>
            <StatusBadge tone="positive" icon={<CheckIcon weight="bold" />}>
              Applied across all 10 routes
            </StatusBadge>
            <Badge variant="outline">1 chip component</Badge>
            <Badge variant="outline">8 space steps</Badge>
          </>
        }
      />

      {/* ------------------------------------------------------------- space */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="01 · Space"
          title="Eight steps, each with one job"
          description="Tailwind will happily accept any spacing value. That is the problem — this app had 120 off-scale spacing utilities before the rule existed. These eight are the only ones a route author needs, and each has exactly one job."
        />
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Utility</TableHead>
                <TableHead>Its one job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SPACE_SCALE.map((row) => (
                <TableRow key={row.step}>
                  <TableCell className="font-mono text-[0.6875rem] tabular-nums text-foreground">
                    {row.step}
                  </TableCell>
                  <TableCell className="font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
                    {row.value}
                  </TableCell>
                  <TableCell className="font-mono text-[0.6875rem] text-muted-foreground">
                    {row.utility}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel
            title="Enforced, not documented"
            description="npm run audit:ui greps every class string and fails on anything outside the eight steps"
            action={<Badge variant="outline">CI gate</Badge>}
          >
            <div className="grid gap-3">
              <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-[0.6875rem] leading-relaxed text-foreground">
{`$ npm run audit:ui
✓ UI audit passed — no new drift;
  0 baselined violations still to pay down.`}
              </pre>
              <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                Before this gate existed the platform carried{" "}
                <strong className="font-medium text-foreground">120 off-scale utilities</strong> — twenty-seven{" "}
                <code className="font-mono">gap-2.5</code>, ten <code className="font-mono">gap-8</code>, fourteen{" "}
                <code className="font-mono">py-2.5</code>. None of them were decisions; they were drift.
              </p>
            </div>
          </Panel>

          <Panel
            title="Control geometry"
            description="The only permitted exceptions, each with a reason attached"
            contentClassName="grid gap-3"
          >
            {SPACE_EXCEPTIONS.map((row) => (
              <div key={row.token} className="grid gap-1 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                <code className="font-mono text-[0.6875rem] text-foreground">{row.token}</code>
                <p className="text-[0.6875rem] text-muted-foreground">{row.why}</p>
              </div>
            ))}
            <p className="text-[0.6875rem] text-muted-foreground">
              These are fixed control dimensions, not rhythm. They are the defaults in{" "}
              <code className="font-mono">scripts/audit-ui.mjs</code>, so every project shares them; a project
              adds its own in <code className="font-mono">scripts/audit-ui.config.json</code>. If an entry stops
              being true, delete it.
            </p>
          </Panel>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {SPACE_RULES.map((rule, index) => (
            <Panel key={rule.title} size="sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.625rem] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-xs/relaxed font-medium text-foreground">
                    {rule.title}
                  </h3>
                </div>
                <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{rule.body}</p>
                <p className="flex items-start gap-1.5 border-t border-border/60 pt-2 text-[0.6875rem] text-muted-foreground">
                  <WarningCircleIcon className="mt-0.5 size-3 shrink-0 text-warning" />
                  <span>
                    <span className="font-medium text-foreground">Fixed: </span>
                    {rule.was}
                  </span>
                </p>
              </div>
            </Panel>
          ))}
        </div>

        <Specimen
          label="space · the dead-space failure"
          note="same content, the rule applied and ignored"
          contentClassName="grid gap-3 sm:grid-cols-2"
        >
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Chip tone="negative" icon={<XIcon weight="bold" />}>
                Before
              </Chip>
              <span className="text-[0.6875rem] text-muted-foreground">
                content-between distributes slack
              </span>
            </div>
            <div className="grid h-52 content-between rounded-lg bg-card p-3 ring-1 ring-foreground/10">
              <p className="text-xs/relaxed text-muted-foreground">Intro copy.</p>
              <p className="text-xs/relaxed text-muted-foreground">A block of numbers.</p>
              <p className="text-xs/relaxed text-muted-foreground">One action.</p>
            </div>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Chip tone="positive" icon={<CheckIcon weight="bold" />}>
                After
              </Chip>
              <span className="text-[0.6875rem] text-muted-foreground">
                content-start, card shrinks to fit
              </span>
            </div>
            <div className="grid content-start gap-3 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
              <p className="text-xs/relaxed text-muted-foreground">Intro copy.</p>
              <p className="text-xs/relaxed text-muted-foreground">A block of numbers.</p>
              <p className="text-xs/relaxed text-muted-foreground">One action.</p>
            </div>
          </div>
        </Specimen>
      </section>

      {/* -------------------------------------------------------------- chips */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="02 · Chips"
          title="One component, two surfaces, seven tones"
          description="Every pill, tag, badge and status marker is the same component. Only the surface changes how big it is, and the surface is decided by whether it sits on a photograph — not by which page it is on."
        />

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <Panel
            title="The two surfaces"
            description="Height and type are fixed by surface; nothing else varies"
            contentClassName="grid gap-4"
          >
            <div className="grid gap-2">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
                flow · 20px · 10px text
              </p>
              <ChipRow>
                <Chip tone="neutral">1,706</Chip>
                <Chip tone="positive" icon={<SealCheckIcon weight="fill" />}>
                  Stable
                </Chip>
                <Chip tone="primary">Global firsts</Chip>
                <Chip tone="warning">VU</Chip>
                <Chip tone="info" icon={<HeadphonesIcon />}>
                  Field audio
                </Chip>
                <Chip tone="negative">Withdrawn</Chip>
              </ChipRow>
            </div>

            <div className="grid gap-2 border-t border-border/60 pt-3">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
                overlay · 22px · 11px text · own scrim
              </p>
              <div className="relative h-24 overflow-hidden rounded-lg bg-gradient-to-br from-sky-200 via-amber-100 to-emerald-200">
                <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-1.5">
                  <Chip surface="overlay" appearance="dark" icon={<span aria-hidden="true">🇺🇬</span>}>
                    Uganda
                  </Chip>
                  <Chip surface="overlay" appearance="highlight" icon={<GlobeIcon weight="bold" />}>
                    Global first
                  </Chip>
                </div>
                <OverlayCaption>(c) observer, some rights reserved (CC BY-NC)</OverlayCaption>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground">
                Shown on a deliberately pale, busy background — the case that broke the old outline chip.
              </p>
            </div>
          </Panel>

          <TableCard
            title="Tones and their meanings"
            description="A tone is a semantic role. Two chips with different tones must mean different things."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chip</TableHead>
                  <TableHead>Meaning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CHIP_TONES.map((row) => (
                  <TableRow key={row.tone}>
                    <TableCell>
                      <Chip tone={row.tone}>{row.tone}</Chip>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.use}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </div>

        <Panel
          title="Live audit of this page"
          description="Measured from the rendered DOM, not asserted"
          action={<Badge variant="outline">data-chip</Badge>}
        >
          <ChipAudit />
        </Panel>

        <Panel
          title="A trap worth knowing about"
          description="Why this chip is a span and not the preset Badge"
          action={<Chip tone="negative">preset limitation</Chip>}
        >
          <div className="grid gap-3">
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              The preset Badge&rsquo;s variants carry{" "}
              <code className="font-mono">dark:bg-input/30</code>. Tailwind compiles{" "}
              <code className="font-mono">dark:</code> with <code className="font-mono">:is(.dark *)</code>,
              which adds a class of specificity — so a dark variant always beats a base utility, and
              tailwind-merge will not remove it either, because a <code className="font-mono">dark:</code>{" "}
              utility and a base utility are different conflict groups.
            </p>
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              Passing <code className="font-mono">bg-black/70</code> to{" "}
              <code className="font-mono">{'<Badge variant="outline">'}</code> therefore does nothing in dark
              mode. Neutralising it with <code className="font-mono">dark:bg-transparent</code> is worse —
              that also wins on specificity and erases the background in both modes. Chip owns its class
              string instead; the preset Badge is untouched and still demonstrated on{" "}
              <code className="font-mono">/components</code>.
            </p>
            <div className="grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Chip tone="negative">Do not</Chip>
                <p className="font-mono text-[0.625rem] text-muted-foreground">
                  {'<Badge variant="outline" className="bg-black/70" />'}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Chip tone="positive">Do</Chip>
                <p className="font-mono text-[0.625rem] text-muted-foreground">
                  {'<Chip surface="overlay" appearance="dark" />'}
                </p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Status vocabulary" description="What earns a chip and what does not">
          <div className="grid gap-3">
            {[
              {
                state: "monitoring",
                chip: null,
                note: "The default state of a country first. It renders as absence — a dash in a table, nothing on a card. Adding a chip for the default makes the exception invisible.",
              },
              {
                state: "stable",
                chip: <StatusBadge tone="positive" icon={<SealCheckIcon weight="fill" />}>Stable</StatusBadge>,
                note: "Three or more concurring identifications. The only verification state worth surfacing on a card.",
              },
              {
                state: "withdrawn",
                chip: <StatusBadge tone="negative">Withdrawn</StatusBadge>,
                note: "Evidence changed or identification was overturned. Always visible, never styled as a warning.",
              },
            ].map((row) => (
              <div
                key={row.state}
                className="flex flex-wrap items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <code className="w-28 shrink-0 font-mono text-[0.6875rem] text-foreground">
                  {row.state}
                </code>
                <span className="w-28 shrink-0">
                  {row.chip ?? <span className="text-[0.6875rem] text-muted-foreground">no chip</span>}
                </span>
                <span className="min-w-0 flex-1 text-[0.6875rem] text-muted-foreground">{row.note}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* ----------------------------------------------------------- overlays */}
      <section className="grid gap-3">
        <SectionHeader
          eyebrow="03 · Overlay"
          title="Text on a photograph"
          description="A photograph is the only surface in the interface whose contrast we do not control. These four rules make that someone else's problem."
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <Specimen label="overlay · correct" note="two scrimmed chips, gradient caption">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-sky-100 via-white to-amber-100">
              <div className="absolute inset-0 grid place-items-center">
                <ImageSquareIcon className="size-8 text-muted-foreground/40" />
              </div>
              <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-1.5">
                <Chip surface="overlay" appearance="dark" icon={<span aria-hidden="true">🇰🇪</span>}>
                  Kenya
                </Chip>
                <Chip surface="overlay" appearance="highlight" icon={<GlobeIcon weight="bold" />}>
                  Global first
                </Chip>
              </div>
              <OverlayCaption>(c) observer, some rights reserved (CC BY-NC)</OverlayCaption>
            </div>
          </Specimen>

          <Specimen label="overlay · incorrect" note="the failure that prompted the rule">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-sky-100 via-white to-amber-100">
              <div className="absolute inset-0 grid place-items-center">
                <ImageSquareIcon className="size-8 text-muted-foreground/40" />
              </div>
              <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-1.5">
                <Chip surface="overlay" appearance="dark">
                  Kenya
                </Chip>
                {/* Deliberately broken specimen: a transparent chip on an image. */}
                <Badge
                  variant="outline"
                  className="h-5.5 gap-1.5 px-2 text-[0.6875rem] font-medium"
                  title="This is what the IUCN chip used to look like on a pale photograph"
                >
                  LC
                </Badge>
              </div>
              <div className="absolute inset-x-0 bottom-0 px-3 pt-10 pb-2">
                <p className="truncate text-[0.625rem] text-muted-foreground">
                  (c) observer — caption without a scrim
                </p>
              </div>
            </div>
          </Specimen>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="grid gap-3">
            {OVERLAY_RULES.map((rule, index) => (
              <Panel key={rule.title} size="sm">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.625rem] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-heading text-xs/relaxed font-medium text-foreground">
                      {rule.title}
                    </h3>
                  </div>
                  <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{rule.body}</p>
                  <p className="flex items-start gap-1.5 border-t border-border/60 pt-2 text-[0.6875rem] text-muted-foreground">
                    <WarningCircleIcon className="mt-0.5 size-3 shrink-0 text-warning" />
                    <span>
                      <span className="font-medium text-foreground">Fixed: </span>
                      {rule.was}
                    </span>
                  </p>
                </div>
              </Panel>
            ))}
          </div>

          <Panel
            title="On the image vs in the body"
            description="The dividing line is whether the fact is about the media or the record"
            contentClassName="grid gap-3"
          >
            <div className="grid gap-2 rounded-lg bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <CameraIcon className="size-3" /> On the image
              </p>
              <ul className="grid gap-1.5 text-[0.6875rem] text-muted-foreground">
                <li>· Where the observation was made (country)</li>
                <li>· How notable it is (global first)</li>
                <li>· Who holds the rights (captioned on the gradient)</li>
                <li>· What kind of media it is (photo / audio)</li>
              </ul>
            </div>
            <div className="grid gap-2 rounded-lg bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <SealCheckIcon className="size-3" /> In the body
              </p>
              <ul className="grid gap-1.5 text-[0.6875rem] text-muted-foreground">
                <li>· Verification status (stable / withdrawn)</li>
                <li>· IUCN Red List category</li>
                <li>· Identification and comment counts</li>
                <li>· Observer, observation date, detection date</li>
                <li>· Media and recording totals</li>
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
              <span className="text-[0.6875rem] text-muted-foreground">Body chips, for reference:</span>
              <IucnChip status="LC" />
              <IucnChip status="NT" />
              <IucnChip status="VU" />
              <IucnChip status="EN" />
              <IucnChip status="CR" />
            </div>
          </Panel>
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Extension"
          title="The three roles the preset does not ship"
          description="The preset gives one brand hue, one alarm hue and a monochrome chart ramp. A research tool also reports at-risk status, provenance context, and rarity — so those three roles are defined once, in app/mri-theme.css, rather than invented per route."
          action={
            <Chip tone="positive" icon={<CheckIcon weight="bold" />}>
              Implemented
            </Chip>
          }
        />

        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Chip</TableHead>
                <TableHead>Light</TableHead>
                <TableHead>Dark</TableHead>
                <TableHead>What it is for</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SEMANTIC_ROLES.map((role) => (
                <TableRow key={role.token}>
                  <TableCell>
                    <code className="font-mono text-[0.6875rem] text-foreground">{role.token}</code>
                  </TableCell>
                  <TableCell>
                    <Chip tone={role.tone}>{role.label}</Chip>
                  </TableCell>
                  <TableCell className="font-mono text-[0.5625rem] text-muted-foreground">
                    {role.light}
                  </TableCell>
                  <TableCell className="font-mono text-[0.5625rem] text-muted-foreground">
                    {role.dark}
                  </TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">{role.use}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel
            title="Global first, resolved"
            description="Rarity now has its own hue, so it never reads as a second green"
            contentClassName="grid gap-3"
          >
            <div className="relative h-28 overflow-hidden rounded-lg bg-gradient-to-br from-sky-100 via-white to-amber-100">
              <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                <Chip surface="overlay" appearance="dark" icon={<span aria-hidden="true">🇰🇪</span>}>
                  Kenya
                </Chip>
                <Chip surface="overlay" appearance="highlight" icon={<GlobeIcon weight="bold" />}>
                  Global first
                </Chip>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="positive" icon={<SealCheckIcon weight="fill" />}>
                Stable
              </Chip>
              <span className="text-[0.6875rem] text-muted-foreground">
                verified state, in the card body
              </span>
            </div>
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              Green now means exactly one thing — verified — and the rarity accent is a distinct gold
              that carries a dark ink, so it stays legible on any photograph.
            </p>
          </Panel>

          <Panel
            title="Portable by design"
            description="Copy one file into any MRI project"
            contentClassName="grid gap-3"
          >
            <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-[0.6875rem] leading-relaxed text-foreground">
{`/* app/globals.css */
@import "tailwindcss";
@import "shadcn/tailwind.css";
@import "./mri-theme.css";`}
            </pre>
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              The extension lives in <code className="font-mono">app/mri-theme.css</code>, not inside the
              preset&rsquo;s generated block, so re-applying the preset cannot clobber it. Every role becomes
              an ordinary Tailwind utility: <code className="font-mono">bg-info</code>,{" "}
              <code className="font-mono">text-warning</code>, <code className="font-mono">ring-notable</code>.
            </p>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="mb-2 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Three values per role
              </p>
              <ul className="grid gap-1.5 font-mono text-[0.625rem] text-muted-foreground">
                <li>
                  <span className="text-foreground">--warning</span> · the solid fill
                </li>
                <li>
                  <span className="text-foreground">--warning-foreground</span> · ink on that fill
                </li>
                <li>
                  <span className="text-foreground">--warning-ink</span> · the role as text on a tinted chip
                </li>
              </ul>
              <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
                Skipping the third value is what breaks dark mode: a{" "}
                <code className="font-mono">--primary</code> dark enough to carry white button text is far
                too dark to <em>be</em> text on a dark card. Before the ink tier, a positive chip measured
                2.1:1 and the notable chip 1.2:1 — effectively invisible.
              </p>
            </div>

            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">Success is deliberately not here.</strong> In
              this preset the brand colour is green and the positive state is green, so a second green role
              would recreate the ambiguity the tokens exist to remove. If MRI ever wants a brand green and a
              distinct success green, that is one line in the same file.
            </p>
          </Panel>
        </div>
      </section>

      <p className={cn("text-[0.6875rem] text-muted-foreground")}>
        Every rule on this page is enforced by the component that owns it — the chip audit above is
        measured live, and the overlay cap warns in development. Rules that only live in a document get
        broken silently.
      </p>
    </PageContainer>
  );
}
