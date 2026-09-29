# Changelog

Consumers pin a tag in `mri.json`; `scripts/check-mri-parity.mjs` fails their build if
an installed file differs from it. Every release is listed here so moving the pin is a
reviewable decision.

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
