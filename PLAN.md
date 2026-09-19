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

**Landed.** `scripts/audit-ui.mjs` audits six rules — spacing, chips, raw tables,
colour literals, banned imports and stylesheets — and replaces the plan's six
separate scripts, which would have been six copies of the same walk. It carries a
baseline (`scripts/audit-baseline.json`) that may only **shrink**: a violation not
in the ledger fails, a violation beyond the ledger's count fails, and an entry
that no longer occurs also fails, so a rewritten file must delete its own
entries. ESLint holds the import bans, since it has no baseline mechanism and can
therefore only carry rules that were already clean. Unit tests cover the ratchet;
`verify` is green on the existing tree.

Measured debt, frozen in the ledger: **492** violations — spacing 444 (62 files),
chips 22 (9), raw tables 3, colour literals 11, banned imports 12, stylesheets 0.
All six figures were confirmed against the tree, and two of them corrected my own
reconnaissance: the "143 colour literals" were Recharts palettes in JS, not class
names (8 are real), and the 12 banned imports are Phosphor's **non-SSR** entry,
not lucide — the platform is lucide-free but 12 files import the entry that calls
`createContext`.

**Step 1 — replace `components/ui`, and convert `asChild` to `render` in the same step.**

Regenerate from the preset's `mira` set. The 13 primitives that imported
`radix-ui` (`badge`, `button`, `checkbox`, `dialog`, `dropdown-menu`, `popover`,
`progress`, `radio-group`, `separator`, `sheet`, `switch`, `tabs`, `tooltip`) and
the 8 that did not (`card`, `chart`, `input`, `native-select`, `pagination`,
`skeleton`, `table`, `textarea`) are all replaced: the second group differs from
the preset's output too. `card` in particular was hand-flattened and predated
`--card-spacing`, which is why card bodies were flush against the bottom edge.

**This step also translates every `asChild` to `render`.** These cannot be
separated: `asChild` is Radix's API and `render` is Base UI's, so each is
meaningless on the other library, and a half-swapped tree does not compile.
Converting inside Step 1 is what keeps the gate below meaningful; the alternative
is a platform that is broken from Step 1 until Step 3 finishes, with no way to
bisect a regression in between.

It is mechanical, and it is not the visual rewrite: Step 3 stays about
presentation.

**Landed.** All 21 primitives are byte-identical to this repository's — the
strongest form of the gate, and mechanically checkable with a `diff` loop. The
two files that were neither preset output nor Radix-based, `stepper.tsx` and
`timeline.tsx`, had no importers at all and were deleted; they were hand-written
components misfiled in the generated layer.

Five things the plan did not anticipate, all measured rather than assumed:

1. **The theme was a second, larger gap.** `shadcn add` does not touch
   `app/globals.css`, so the platform kept a `radix-vega`-era stylesheet — hex
   colours, no `.dark`, no sidebar tokens, and no `@import "shadcn/tailwind.css"`.
   That last one is the dangerous one: the file supplies the `data-*` custom
   variants (`data-checked`, `data-open`, `data-disabled`, …) that every Base UI
   primitive is written against. Without it each state variant silently fails to
   compile. `--font-heading` was added for the same reason. Colour values were
   deliberately left alone: changing them is Step 3's job.
2. **`asChild` was 47 occurrences on 43 lines across 21 files**, not "43 call
   sites across 23 files". The line count was right and the occurrence count was
   not, because one `not-found.tsx` line carries four of them and one country page
   carries two. Converted with a TypeScript-AST codemod that splices source text
   rather than reprinting it, so formatting survives — there is no Prettier in
   this repository to fall back on.
3. **The hand-added `Badge` `size` variant disappeared**, breaking 58 call sites.
   It was not restored: `Chip` mandates one size per surface ("Two surfaces, one
   size each. Nothing else varies."), and the preset `Badge` is already 20px — the
   `flow` chip geometry. The prop was dropped mechanically and the ratchet
   recorded it.
4. **`shadcn add` silently downgraded `recharts` 3.10.1 → 3.8.0** by writing its
   own declared range. Reverted: Step 1 must not change chart behaviour, and a
   downgrade is not the direction to reconcile two repositories from. This
   repository's `^3.8.0` range is the one to raise, not the platform's to lower.
5. **`nativeButton={false}` erases the link role**, which makes this repository's
   own deviation 2 wrong. Base UI's `Button` compiles to
   `isNativeButton ? { type: "button" } : { role: "button" }`, so
   `<Button nativeButton={false} render={<Link/>}>` produced real `<a href>`
   elements that announced as **buttons**. The platform's e2e suite caught it —
   three tests failed on `getByRole("link")` — while this repository's own site
   carries the same defect with nothing testing it. Navigational links now put
   `buttonVariants()` on the link itself (43 sites across 19 files) and `Button`
   is reserved for actions. Deviation 2, `AGENT-RULES.md` and trap 4 are
   corrected; the template's own pages still need the same pass.

Also removed: the 12 remaining bare `@phosphor-icons/react` imports (the
`createContext` hazard the preset avoids by using `/dist/ssr`), taking the frozen
ledger from **492 to 480**.

**Gate:** `components/ui` diffs clean against this repository's; `radix-ui`,
`clsx` and `tailwind-merge` removed from `package.json`; zero `asChild` in the
tree; `verify` green.

**Step 2 — replace `components/platform` with the design system's shell.**

Install `theme`, `chip`, `layout`, `patterns` and `chip-audit` from this registry.
Delete the 4 files in `components/platform`.

**Naming collision — resolved.** The platform already has a
`components/shell/` holding its chrome (`header`, `footer`, `breadcrumb`,
`routes`), while this registry's items targeted `~/components/shell/*` and mean
something different by it — the compositions a route is built from.

This repository renamed its own layer to **`components/mri/`**, which is now the
registry's install target, and moved its review scaffolding to
`components/site/`. The platform's `components/shell/` therefore keeps its
conventional meaning and does not move, so no platform import churns for a
rename. `components/mri/` is also the clearer name where it matters most: in the
*other* MRI projects that install from this registry, where "the MRI layer"
is exactly what it is.

**Landed.** All four files are gone and `components/mri/` is the install target;
no route imports `components/platform`. 31 import statements across 30 files were
rewritten, and the call sites themselves needed almost nothing — these components
are supersets of the ones they replaced, so most routes changed one line.
`components/mri` and `components/ui` are byte-identical to this repository's.

Three corrections to the plan above:

1. **`specimen-card` was not installed.** It imports `@/lib/data` — the review
   site's `inat`/`birds` fixtures — and `@/lib/format`, and `registry.json`
   declares neither, so it cannot build outside this repository. The platform does
   not need it to replace `components/platform`. See Known gaps.
2. **Four gaps had to be closed here first.** `PageHeader.titleTag`,
   `MetricStripSkeleton.label`, per-column `columns` configs on `TableSkeleton`,
   and `ToolbarSkeleton` entirely were all missing while the platform depended on
   them. They are upstreamed in v0.3.0 rather than forked into the platform, so
   the superset lives in the rule book and the next project gets it free.
3. **The audit had to learn about this layer.** The platform's audit now excludes
   `components/mri/` exactly as it excludes `components/ui/`: both are installed
   and regenerated, so auditing them locally reports this repository's decisions
   as the platform's drift and breaks on every reinstall. `app/mri-theme.css`
   joined its CSS allow-list with a reason, and the ledger ratcheted 480 → 469.

Installing `patterns` also overwrote the platform's corrected
`components/ui/checkbox.tsx` with the raw preset — twice, once per install. That
is now trap 5 in both rule sets, with the `diff` loop that catches it.

**Gate:** met. No route imports `components/platform`; `StatusBadge` renders the
shared `Chip`, whose only two surfaces are `h-5` (20px) and `h-5.5` (22px);
`verify` green with 48/48 e2e.

**Step 3 — rewrite the 28 routes, one per commit, worst-first.**

Xeno-canto and iNaturalist first: they carry the hand-rolled chips and the
inconsistent tables. The `asChild` → `render` conversion that used to live here
moved into Step 1, where it belongs — it is a library swap, not a presentation
decision. This is the bulk of the work and it should look boring.

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

- **`specimen-card` is not portable.** It imports `@/lib/data` — the review site's
  `inat.json` / `birds.json` fixtures — and `@/lib/format`, and `registry.json`
  declares neither. Installing it into any other project produces a broken build.
  The platform dropped it in Step 2 for exactly this reason. Either split the item
  so the fixture-bound half stays here, or declare the dependency.
- **A registry dependency can silently regress a base primitive.** Any item
  depending on `checkbox` — so `patterns` and `specimen-card` — overwrites the
  consumer's `components/ui/checkbox.tsx` with the raw preset, whose Phosphor
  import is the bare entry that deviation 1 exists to avoid. Installing `patterns`
  did this to the platform twice. Ship the base primitives as corrected items, or
  make the re-fix an explicit post-install step rather than one implied by
  "Adding components".
- **`lib/format.ts` should be a registry item.** The platform carried nine separate
  hand-rolled `formatNumber` implementations across nine files; `lib/format.ts` is
  the single dependency-free answer, and the only part of `specimen-card`'s `lib/`
  dependency that is genuinely portable.
- **The platform's `--ring` fails contrast** — `#a9a39a`, roughly 2.2:1 on white,
  below the 3:1 a focus indicator needs. Raised in Step 1, still unresolved.
- The platform design guide carries three corrections that Step 3 resolves:
  "light-only interface" is false, `p-3.5` is off-scale, and its icon sizes
  conflict with the master's.
- `eslint` is pinned to `^9` here because `eslint-config-next@16.3.4` bundles an
  `eslint-plugin-react` incompatible with ESLint 10.
