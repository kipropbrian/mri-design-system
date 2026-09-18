# MRI design system — plan

**Where this stands.** Phases 0–3 are complete: the old prototype was rescued and
trashed, this repo was renamed and relocated out of the platform, the wiki
contract page exists, and the platform design guide is rewritten as deltas. The
rescue decisions are implemented. What follows is only what is left.

---

## 1. The decision that shapes everything else

### Do we swap the platform's primitive library — Radix → Base UI?

This is the only decision that changes the size of the remaining work.

| | Platform today | This design system |
| --- | --- | --- |
| shadcn style | `vega` (**Radix**) | `mira` (**Base UI**) |
| Icons | `lucide-react` | `@phosphor-icons/react/dist/ssr` |
| `asChild` call sites | **53** across 23 files | `render` props |
| Files importing `radix-ui` | **13** | 0 |
| `components/ui` primitives | 23 | 37 |
| Routes | 28 | 14 |

**Why it is not a restyle.** `vega → mira` is a library change. `asChild` becomes
`render`, `lucide` becomes Phosphor, and the Dialog / Sheet / DropdownMenu /
Select / Tooltip compositions all change shape. `shadcn apply --preset` would
regenerate 23 primitives out from under 23 files that consume them.

**Option A — land the additive layer only. (Recommended.)**

Install `mri-theme.css`, the `Chip` system, `Panel`, `MetricCard`, `FilterSidebar`,
`StatusPath`, `RecordChange` and the data states on the platform's **current**
Radix stack. These are plain Tailwind plus tokens — no Radix, no Base UI — so
this is additive and reversible. It delivers every visible change: one chip size,
the semantic roles, the spacing scale, the overlay rules.

The cost is that `components/ui` stays on Radix and the platform keeps `lucide`
in places. That divergence is real but invisible to users.

**Option B — additive layer *and* the primitive swap.**

Only worth it if you want the platform and the design system to be literally the
same stack, or you intend to adopt Base UI's API going forward. It is a
primitive-by-primitive migration behind the existing test suite — not one
`shadcn apply` — and it touches all 28 routes.

**What I need from you:** A or B. If A, Phase 4 proceeds and Phase 5 closes. If B,
I write a per-primitive sequence for review before touching any code.

---

## 2. Under review — the plan is being re-framed

Two decisions landed that change the shape of what follows, so §1, §3 and §4 are
provisional until the rewrite question is answered:

- **This repository is now under version control** (first commit `ae9a3dc`).
- **The registry is dropped.** This is an internal tool, so there will be no
  published shadcn registry and no hosting requirement. What replaces it is open:
  copy once and diverge, vendor with a sync + drift check, a git submodule, or a
  private package.
- **The platform has no users, so a full UI rewrite is acceptable.** That removes
  the main reason the additive-only option was recommended: the 47 `asChild` call
  sites and 13 Radix primitives were expensive to retrofit, but they are files a
  rewrite touches anyway. The decision is therefore no longer "port or rewrite"
  but **which stack to rewrite onto**.

Measured, and correcting earlier assumptions in this document:

| Claim | Reality |
| --- | --- |
| "`lucide` becomes Phosphor" | **0 lucide imports.** The platform is already Phosphor-only. |
| Many hand-rolled tables | **3** files contain a raw `<table>` outside `components/ui`. |
| Custom CSS to remove | **1** CSS file: `app/globals.css`. |
| `asChild` blast radius | 47 call sites across 21 consumer files; only 6 inside `components/ui`. |
| Consumer files importing `components/ui` | 61 |

The platform is in better shape than this plan first assumed. The debt is
concentrated in `components/ui` (13 Radix primitives) and in 21 consumer files
that use `asChild`.

## 3. Phase 4 — land the additive layer on the platform

Not blocked by the decision above if you choose A. Blocked *by* that answer only
in the sense that B would reorder it.

### What is portable to the current Radix stack

| File | Portability |
| --- | --- |
| `app/mri-theme.css` | Drop-in. Plain token declarations. |
| `components/shell/chips.tsx` | As-is — a `<span>` with Tailwind classes. |
| `components/shell/chip-audit.tsx` | As-is — plain React. |
| `components/shell/patterns.tsx` | Light adaptation: the platform's `Card` uses `px-3.5`/`py-3`/`border`, this one uses `--card-spacing`/`ring-1`. Same API. |
| `components/shell/charts.tsx` | Verify: the platform already has `components/ui/chart.tsx` with the same `var(--color-key)` contract. |
| `scripts/audit-spacing.mjs` | Drop-in, but run it **report-only** first — the platform will have many off-scale values and the script exits non-zero by design. |

### Sequence

1. Port `mri-theme.css` and the chip system, with the chip audit alongside it.
2. Run the spacing audit report-only and triage: fix, or add to the documented
   geometry exceptions in the script. Expect a real number, not zero.
3. Migrate one surface per commit, worst offenders first. The Xeno-canto
   components are the obvious start — they are already showing as modified in the
   platform working tree.
4. Adopt the rescued patterns where they fit: `FilterSidebar` on `/metadata` and
   `/inaturalist/country-firsts`, `StatusPath` on the country-firsts ledger.

**Gate:** platform `npm run verify` green; the chip audit reports only 20px/22px;
no file left dangling in the working tree.

---

## 4. How other MRI projects consume this (registry dropped)

Open. Without a registry there is no automatic update path, so the choice is how
much drift to tolerate:

| | Mechanism | Drift risk | Cost |
| --- | --- | --- | --- |
| C1 | Copy `mri-theme.css` + `components/shell` once | High — diverges immediately | None |
| C2 | **Vendor + a `sync:design` script that copies from this checkout and records the source commit, plus an `audit:design-drift` that fails when the vendored copy differs** | Low — drift is detected | Small |
| C3 | Git submodule | Low | Awkward with Next/TS path resolution |
| C4 | Private npm package | Lowest | Needs this app split into a package |

C2 fits an internal tool with a handful of consumers. Note that the *audits* are
the portable part — a rule book cannot enforce anything, a script can — so the
copyable set is `mri-theme.css`, `components/shell`, the rule book, and
`scripts/audit-*.mjs`.

## 5. Decided and implemented

Recorded so they are not re-litigated.

| Decision | Outcome |
| --- | --- |
| **Typeface** | **Inter leads**, because the preset ships `font: inter` and the platform uses it. **Atkinson Hyperlegible is retained as the legibility fallback** (Braille Institute, low-vision reading) — offered in the picker, not the default. |
| **`--info` hue** | Keep the design system's saturated blue. Lean on the new preset rather than the older muted teal. |
| **Persistent filter sidebar** | Added to the master as `FilterSidebar`, paired with `lg:grid-cols-[minmax(0,1fr)_18rem]`. |
| **Previous→current status path** | Added to the master as `StatusPath` and `RecordChange`. |
| **Two platform rules promoted into the master** | The data-card header's three rules (title carries its count; ~40-character description; no eyebrow inside a data card) are now stated on `/patterns`. The binomial `font-serif italic` rule is already in the master's type scale. |
| **Everything else in the rescue** | Trashed. The old palette, shadows and 61KB stylesheet are superseded by the preset. |

---

## 6. Known gaps

- **The rewrite question is unanswered** (§1, §2). This is the blocker.
- **Consumption mechanism is unanswered** (§4).
- `eslint` is pinned to `^9` here because `eslint-config-next@16.3.4` bundles an
  `eslint-plugin-react` incompatible with ESLint 10.
- The platform design guide carries three corrections that a migration resolves:
  "light-only interface" is false, `p-3.5` is off-scale, and its icon sizes
  conflict with the master's.
- **One legitimate custom-CSS carve-out exists and the rules must name it or
  absorb it:** the isolated upload/media player (`public/bird-review/player.css`,
  `transport.css`, `embed.css` plus `player.js`), which is why `app/globals.css`
  carries a `--bg`/`--bg-surface` compatibility block marked "used only by the
  isolated upload media player". If the rule is "no custom CSS", this is either
  the single documented exception or it becomes a React component.
