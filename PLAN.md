# MRI design system — plan

**Direction settled.** The platform will be **rewritten onto the design system's
stack**, enforcement first. This repository is under version control and is
already shaped to be distributed as a **GitHub registry** — no server hosting.

Phases 0–3 (rescue, rename, relocate, wiki, platform design guide) are complete
and their detail is in `RESCUE-NOTES.md` and git history.

---

## 1. How this is distributed: a GitHub registry

**A registry is not a git repo — but shadcn will treat a GitHub repo as one.**
That is why this needs no hosting, no build step and no server:

- `registry.json` at the repository root declares the items. ✅ done, 8 items,
  validated with `npx shadcn@latest build`.
- Push to GitHub, and consumers install with
  `npx shadcn@latest add <owner>/mri-design-system/chip`.
- Works for **private** repositories too: `gh auth login` locally, or
  `GH_TOKEN` in CI. Nothing else is configured.
- Pin with a ref for reproducibility: `…#v1.0.0` or `…#<commit-sha>`.

**One input needed: the GitHub owner.** `registry.json` uses `OWNER` in six
places (the homepage plus five `registryDependencies`), because a same-repo
dependency must be a full `owner/repo/item` address. `shadcn build` does not
resolve them, so it validates either way — but **install would fail until they
are real.** Replace `OWNER` once the repository exists.

What is published, and why these eight:

| Item | Carries |
| --- | --- |
| `theme` | `app/mri-theme.css` — info / warning / notable plus the ink tier |
| `agent-rules` | `AGENT-RULES.md` — the imperative rules, for `AGENTS.md` |
| `chip` | The single chip, two surfaces |
| `chip-audit` | The self-measuring audit |
| `spacing-audit` | The CI gate |
| `layout` | `PageContainer`, `PageHeader`, `SectionHeader` |
| `patterns` | Panels, metrics, `FilterSidebar`, `StatusPath`, `RecordChange`, data states |
| `specimen-card` | The overlay reference implementation |

Registry items are **not limited to components** — the audits and the agent rules
ship by the same mechanism. That matters: a rule book cannot enforce anything, a
script can, so the portable part is the tooling.

---

## 2. The rewrite

Chosen because the platform has no users. That removes the only reason to keep
Radix: the 47 `asChild` call sites and 13 Radix primitives were expensive to
*retrofit*, but a rewrite touches those files anyway. Deciding once now avoids
porting to Radix and swapping later.

### Do not touch

The data and infrastructure layer stays exactly as it is: **36 files in `lib/`**,
**23 API routes**, **22 migrations**, **29 scripts**, the D1 queries, and the
Cloudflare/OpenNext deploy. This is the whole reason the rewrite is tractable.

### Order of work

Each step has a gate. Do not start the next until it passes.

**Step 0 — enforcement harness, before any UI changes.**

Nothing visible changes. This is the step that makes the rest stick.

- `scripts/audit-spacing.mjs` — run **report-only** first; the platform will have
  a real number of off-scale values. Triage: fix, or add to the documented
  geometry exceptions. Do not silence it wholesale.
- New source audits in the same shape: `audit-chips` (no chip-shaped class
  strings outside `chips.tsx`), `audit-tables` (no raw `<table>` outside the
  shared composition — there are 3 known offenders), `audit-css` (only the
  sanctioned files), `audit-tokens` (no `#hex`/`rgb()`/`oklch()` literals in
  class names), `audit-icons` (only `@phosphor-icons/react/dist/ssr`).
- ESLint for what grep cannot parse: `no-restricted-imports` on `radix-ui`,
  `@base-ui/react` and `lucide-react` outside `components/ui`;
  `no-restricted-syntax` on `<table>` and inline colour styles.
- `AGENT-RULES.md` installed into the platform and referenced from its existing
  `AGENTS.md`.
- Wire every audit into `npm run verify`, which the deploy gate already runs.

**Gate:** `verify` green on the *existing* code, with the new audits passing or
their exceptions documented. Drift can no longer ship.

**Step 1 — replace `components/ui`.**

Regenerate from the preset's `mira` set. Delete the 13 Radix primitives. Keep the
10 already-agnostic ones (`card`, `chart`, `input`, `native-select`, `pagination`,
`skeleton`, `stepper`, `table`, `textarea`, `timeline`) unless the preset's
version differs.

**Gate:** `components/ui` matches a fresh `shadcn add` run; `radix-ui` removed
from `package.json`.

**Step 2 — replace `components/platform` with the design system's shell.**

Install `theme`, `chip`, `layout`, `patterns` and `specimen-card` from this
registry, or vendor them. Delete the 4 files in `components/platform`.

**Gate:** no route imports `components/platform`; the chip audit reports only
20px/22px on a migrated page.

**Step 3 — rewrite the 28 routes, one per commit, worst-first.**

Xeno-canto and iNaturalist first: they carry the hand-rolled chips and the
inconsistent tables. Convert `asChild` → `render` as you go (47 sites across 21
files). This is the bulk of the work and it should look boring.

**Gate per route:** `verify` green, and the route's e2e selectors repointed.

**Step 4 — the e2e suite.**

**37 tests across 9 specs assert on current DOM** (`div.space-y-3`, heading
regexes like `/^Audio Contributors \(\d+\)$/`). They will break. That is the cost
*and* the safety net — repointing them is what proves the rewrite preserved
behaviour. Prefer role and `data-testid` selectors over structural ones so the
next rewrite is cheaper.

**Gate:** 37 tests green against the new markup.

**Step 5 — the carve-out and the final sweep.**

- **The media player.** `public/bird-review/{player,transport,embed}.css` plus
  `player.js` is genuine custom CSS, which is why `app/globals.css` carries a
  `--bg`/`--bg-surface` block marked *"used only by the isolated upload media
  player"*. **Recommended: absorb it into a React component and delete the CSS**,
  so "no custom CSS" stays absolute. One documented exception becomes ten
  otherwise. If it is kept, the rule must name it explicitly.
- Remove the compatibility aliases block if the player is absorbed.
- Re-run every audit on the finished tree.

**Gate:** all audits green with no exceptions beyond the documented geometry
ones; `verify` green.

### Risks

- **Regressions in a working app.** Mitigated by the e2e suite and one route per
  commit — the rewrite is never in a half-broken state across route boundaries.
- **Drift during the rewrite.** Mitigated by Step 0 landing first: the new code is
  correct by construction and the old code is deleted rather than migrated.
- **Scope creep into the data layer.** The rule is that `lib/`, `app/api/` and
  `migrations/` are not touched. If a route needs different data, that is a
  separate change.

---

## 3. Decided

| Decision | Outcome |
| --- | --- |
| Distribution | **GitHub registry** — no hosting, no server, works privately |
| Platform approach | **Rewrite the presentation layer** onto the design system's stack |
| Typeface | **Inter leads**; **Atkinson Hyperlegible retained as the legibility fallback** |
| `--info` hue | Keep the design system's saturated blue; lean on the new preset |
| Filter sidebar | `FilterSidebar` added to the master |
| Status path | `StatusPath` + `RecordChange` added to the master |
| Promoted rules | Data-card header rules and the binomial `font-serif italic` rule now in the master |
| Everything else in the rescue | Trashed; recoverable from the trash |

---

## 4. Known gaps

- **`OWNER` placeholder in `registry.json`** (6 occurrences) — blocks install, not
  validation.
- **No git remote yet.** The repository is committed locally with no origin.
- The platform design guide carries three corrections that Step 3 resolves:
  "light-only interface" is false, `p-3.5` is off-scale, and its icon sizes
  conflict with the master's.
- `eslint` is pinned to `^9` here because `eslint-config-next@16.3.4` bundles an
  `eslint-plugin-react` incompatible with ESLint 10.
