# Changelog

Consumers pin a tag in `mri.json`; `scripts/check-mri-parity.mjs` fails their build if
an installed file differs from it. Every release is listed here so moving the pin is a
reviewable decision.

## v0.9.1 — 2026-10-15

### Added
- **`AudioPlayer` `compact`** (`audio-player`): icon-only replay, for narrow cards where
  the screen-width breakpoint does not apply. The Replay label becomes screen-reader
  text, the button is named `Replay “<label>” from the beginning` and becomes a square
  `size-9` icon button, and the `R` key hint stays hidden at every width. Off by default, so no
  existing player changes. It came from the platform's East Africa Firsts sound cards,
  which sit three to a row on a wide screen.
- `AGENT-RULES.md` says when to use it.

## v0.9.0 — 2026-10-04

### Added
- **`RadialMeter`** (`charts`): one share of a whole as a ring with the figure inside
  it. Plain SVG, so it is server-rendered at its final size. The track is the series'
  own hue at low opacity, and the arc is shortened by its round caps so the painted
  length is the value (left alone, 75% paints as roughly 78%).
- **`UnitGrid`** (`charts`): one cell per thing counted, for a collection small enough
  to show whole and for a subset of it shown beside the whole. Levels are class names
  in the `AvailabilityGrid` shape, so `AvailabilityLegend` accepts them as they are.
  **Give every level its own hue**: three shades of the olive ramp read as one colour
  on screen and were sent back for it. One pointer-driven tooltip for the whole grid;
  `onSelect` is a mouse shortcut, since the cells are not focusable.
- **`Dumbbell`** (`charts`): the same thing measured twice, one row per thing, on the
  whole 0–`max` scale. A filled dot and an open ring sized so the dot sits inside the
  ring when they coincide — "no difference" is a finding two bars never show cleanly.
- **`SplitBar`** (`charts`): one total divided into its parts, as a single bar with its
  key underneath. The form for "how does this group split" when the group itself keeps
  changing, under a filter say. Plain markup, so it is server-rendered and resizes
  without measuring; a part of 1 in 500 keeps a minimum width, and the count and share
  are written in the key. It was written in the platform first and is brought upstream
  here so the two copies of `charts.tsx` are one file again.
- **`MultiArea`** (`charts`): two or three series as filled outlines over one ordered
  axis, for the *shape* of a quantity (how scores are spread from low to high). Not
  stacked, so each outline is its own value; the fill is the series' hue at low opacity
  so overlapping shapes stay legible. `labelKey` heads the tooltip when the axis tick
  is an abbreviation of it.
- **`MultiRadar`** (`charts`): two or three series compared across five to fourteen
  unordered categories, as overlaid outlines. The scale is pinned (`domain`, `[0, 100]`
  by default) because a radar scaled to its data turns a small gap into a collapse. The
  fill is almost transparent: three translucent hues laid over each other average to
  grey, so the outline carries the series. Spoke labels are drawn outside the plot and
  are not wrapped, so they want one word each. No demo on `/charts` yet; `SplitBar` and
  `MultiArea` have none either.
- **`MultiLine` `dots`, `domain`, `ticks`, `unit` and `labelSeries`** (`charts`): marked
  points for a handful of ordered categories, a pinned value axis with its own tick
  values, a unit on ticks, labels and tooltip, and direct labels on the one series the
  figure is about.

### Fixed
- **`MultiLine` `data`** (`charts`) is typed as rows keyed by `xKey`, like `MultiArea`.
  It was `YearPoint[]`, which requires a `year` field, so a categorical axis added in
  v0.8.0 could not be typed without one. `YearPoint` still exports and still fits.

### Changed — chart colour guidance
- **The olive-ramp guidance is retired.** The rule book, `lib/chart-colors.ts`,
  `charts.tsx`, the `dataColours` audit hint and the `/charts`, `/foundations` and home
  pages all taught the same thing: draw up to three series from `--chart-1 … --chart-5`,
  darkest first. Charts drawn that way read as one colour at several strengths and were
  sent back twice. The instruction is now **one hue per series, slice or level** —
  `seriesColors(n)`, or the status roles when levels run from good to bad — and
  **never shades of one colour**, ordered scale or not.
- **`CHART_COLORS` is deprecated.** It is an alias of `OLIVE` whose name reads as "the
  chart palette". It still exports, so nothing breaks.
- **`InatScanArea` and `InatTaxaBar`** (`charts`) no longer draw in olive shades: the
  area's two series are teal and indigo, and the taxa bars are one colour instead of
  fading by rank. Neither is used by the platform.
- `AvailabilityGrid`'s guidance now asks for two data levels in two hues. The component
  is unchanged; it takes whatever classes it is given.
- Not changed: the `--chart-1 … --chart-5` tokens, `OLIVE`, the single-colour defaults
  (`CountryBar`, `CategoryBar`, `RadialMeter`, `Dumbbell`) and `StatusDonut`'s olive
  fallback, so no existing chart changes under a consumer.

These came from the platform's model-comparison report, where three tall bar charts
were replaced by rings, a unit grid, two dotted lines and a dumbbell in a third of the
space. Specimens are on `/charts` under "Shares and pairs".

## v0.8.0 — 2026-10-02

### Added
- **`seriesColors(n)`** (`charts`): the first `n` identity colours,
  most-separated-first. `CATEGORICAL` is a hue wheel (red → orange → olive → green →
  teal → blue → indigo → purple → pink), so its first three steps are the three
  warmest hues and a three-series chart drawn from them reads as one colour again —
  the exact failure the ramp exists to prevent. `CATEGORICAL_ORDER` takes every third
  step first (blue, red, green), so any prefix is the most separated set at that
  length. `categoricalConfig` now allocates through `seriesColors`.
- **`CategoryBar`** (`charts`): one bar per category on identity colours, for charts
  whose bars are different things rather than the same measure at different sizes.
  `max` pins a percentage axis so two figures of the same measure stay comparable.
- **`StatusDonut` `colors`** (`charts`): pass `seriesColors(n)` when the slices are
  identities. The default stays the olive ramp for ordered magnitude. This replaces
  the CSS-variable override (`[--chart-4:var(--chart-cat-5)]`) that consumers were
  writing to reach the categorical tokens through a donut.
- **`MultiLine` `xKey` and `curve`** (`charts`): a categorical x-axis, and `linear`
  for a measured relationship, where `monotone` was inventing values between points.

### Fixed
- **`GroupedBar` and `CountryBar` series fills.** They read `var(--color-<key>)`,
  which `ChartContainer` injects — but a CSS custom property name is an identifier and
  cannot contain a dot. A series keyed `birdnet-v2.4` asked for
  `--color-birdnet-v2.4`, the invalid reference was dropped, and the bar rendered with
  SVG's default black fill while its legend stayed correct. Both now pass
  `config[key].color` straight through, so any key works.
- **`cardPadding` matched prose.** The rule scanned raw source for
  `p-(--card-spacing)`, so the rule book's own sentence and a chart specimen label
  naming the token were reported as violations of the rule they document. It now reads
  `className` values only, and has a regression test.

### Added — audit
- **`cardPadding`** rule (28 in all): an unpadded or flush card body, and
  `p-(--card-spacing)` written outside `<Card>` / `<Panel>`, where the token is not in
  scope and the padding silently resolves to zero. Contributed from the platform's
  iNaturalist audio workspace.

## v0.7.0 — 2026-09-29

### Added
- **`ChoiceNav`** (`choice-strip`): navigation between sibling pages. A native select
  below `sm` — one tap to the OS picker — and a wrapping band from `sm` up. Place it
  under the `PageHeader`.
- **`native-select`** item: the preset native select with its Phosphor import corrected,
  so `choice-strip` does not pull the bare entry.
- **`parity-check`** item: `scripts/check-mri-parity.mjs` compares every installed file
  with the version pinned in `mri.json`.
- **Three audit rules** (27 in all): `badge` (the preset `Badge` outside the generated
  layer), `charts` (a `recharts` import outside `components/mri/charts.tsx`) and
  `transitionAll`. New config allow-list: `badgeAllowed`.
- **npm `dependencies`** on every registry item that imports a package.
- **Type stacks and base treatment in `mri-theme.css`**: `--font-mono`, `--font-serif`,
  heading tracking, the selection colour and tap highlight — previously only in the
  platform's `globals.css`.
- **Phones** section in the rule book: touch targets, one control on a phone bar, 16px
  form text, and hydration-safe first renders.
- CI: `.github/workflows/verify.yml` runs `npm run verify` and `shadcn build`.

### Changed
- A `ChoiceStrip` band wraps instead of scrolling sideways.
- `AudioPlayer` names its transitions (`transition-colors`, `transition-[height]`).
- The review site's pages use `Chip` instead of the preset `Badge`, which the rule book
  forbids everywhere else. `/components` and the broken specimen on `/rules` keep it.
- `sheet` declares its `button` dependency.

### Fixed
- The README's item table, pin example, tone count and primitive count; the rule book's
  reference-implementation path (now the GitHub URL); two resolved items in `PLAN.md`.

## v0.6.9 and earlier

See `git log` and `PLAN.md`.
