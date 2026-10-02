# Changelog

Consumers pin a tag in `mri.json`; `scripts/check-mri-parity.mjs` fails their build if
an installed file differs from it. Every release is listed here so moving the pin is a
reviewable decision.

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
