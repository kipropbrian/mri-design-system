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

**Landed.** The ledger went from **469 violations to none**, and all six rules
read zero: spacing, chips, tables, colour literals, banned imports, stylesheets.
It ran in five commits rather than 28, because the work did not divide along route
boundaries and pretending it did would have produced commits nobody could review.

What it actually took, none of which the plan predicted:

1. **Spacing was 406 of the 469**, across 57 files — plus 10 files spelled
   correctly and 4 spelled with a different value entirely. Collapsing it file by
   file would have taken a dozen sessions and still left the same value reading
   differently in two places, so it went in one reviewed pass with a published
   equivalence table: **nearest step, ties round down**, so a pass can tighten an
   interface but never widen one. Nothing can start overflowing as a result.
2. **The chips were five different colours for one meaning.** Three filter toggles
   in iNaturalist were emerald, amber and chart-2 depending on which filter was
   active — they now share `Chip tone={on ? "primary" : "neutral"}`, because all
   three mean one thing. The homepage's badge tones were a colour string in the
   page's own data; `badgeTone: string` is now `ChipTone`, so the type system holds
   the line.
3. **`monitoring` stopped rendering a chip**, which the rule book asked for and the
   platform had never done. Only `stable` and `withdrawn` earn one.
4. **`IucnBadge` carried a 44-line colour map** for seven IUCN codes in two visual
   variants. It is now the shared `IucnChip`, taking its tone from `IUCN_TONE` —
   which is precisely what extracting `lib/taxonomy` was for.
5. **Two raw tables** now use the shared composition, and `#birdTable` kept its
   `id`, its `#birdTableBody` and its `th`/`td` elements so the e2e suite still
   finds exactly what it looks for.
6. **One e2e assertion broke**, exactly as the plan said it would: the checklist
   table header asserted the old `px-2.5`.

**Step 4 — the e2e suite.**

**37 tests across 9 specs assert on current DOM** (`div.space-y-3`, heading
regexes like `/^Audio Contributors \(\d+\)$/`). They will break. That is the cost
*and* the safety net — repointing them is what proves the rewrite preserved
behaviour. Prefer role and `data-testid` selectors over structural ones so the
next rewrite is cheaper.

**Gate:** 37 tests green against the new markup.

**Landed**, and the suite is now **48 tests**, not 37. The gate was already met
before this step began — the suite passes — so the work here was the part the plan
actually cared about: making it survive the *next* rewrite.

Checking every selector against the source turned up **six assertions that were
passing vacuously**. `.hero`, `.toolbar`, `.table-wrapper`, `.checklist-badge`,
`#filterPanel` and `#filter-buboOnly` do not exist anywhere in the tree, and
`#radar-analytics` / `#radial-analytics` / `#scatter-analytics` never did. Each was
a `toHaveCount(0)`, so each passed by matching nothing and would have kept passing
if the thing it guarded against came back. They now point at real hooks — the
bird-only ids that must be absent, `#sidebarFilters`, `[data-chip]:has-text("BUBO")`,
and `.recharts-radar` for the chart type that was actually removed.

Structural selectors were replaced with test ids: `div.space-y-3`,
`.species-detail-link` (six uses), the three alignment anchors
(`header > div`, `main > div`, `main > div > div`) and the quiz geometry
assertions. Getting the alignment anchors wrong the first time was instructive: the
test caught it with a 31px difference — exactly the `lg:px-8` step its own comment
warns about — so the fix was measured off the live DOM rather than guessed twice.

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

**Landed.** All six audit rules read zero with an empty ledger, and `verify` is
green with 48/48 e2e.

**The player was kept, and the rule names it.** The plan preferred absorbing it.
On inspection that is 606 lines of CSS and 1,657 lines of imperative audio and
transport JavaScript, and it is not part of the app's DOM at all: it is a
standalone document (`public/bird-review/player-frame.html`) in an iframe, with its
own stylesheet. Absorbing it is a rewrite of a working media runtime, not a
carve-out, and the plan allows the alternative — "if it is kept, the rule must name
it explicitly". It is now named in the platform's rule set and in each audit
exception, with the reason it is safe: an iframe cannot leak styles into the app.

**The compatibility aliases were dead, which the plan could not have known.**
`app/globals.css` carried 21 `--bg` / `--text` / `--forest` / `--amber`
declarations marked "used only by the isolated upload media player". The iframe
never loaded that file, and nothing else referenced them: a tree-wide search for
`var(--x)` returns zero for all 21. Removed. The `--shadow-*` and `--font-*`
declarations beside them were **kept**, because those are Tailwind theme variables
that `shadow-xs` (94 uses) and `font-mono` (245 uses) actually consume — deleting
them would have quietly reverted the warm shadows to neutral grey.

**One project-level consequence worth stating.** Because `components/mri` and
`components/ui` are both installed rather than owned, the platform's audit now
excludes them, exactly as it always excluded `components/ui`. Auditing installed
code locally reports this repository's decisions as the platform's drift and breaks
on every reinstall — which is what the `checkbox` item was fixed to stop.

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

**Closed in v0.4.0.** All four defects Step 2 exposed are fixed:

- **`specimen-card` is portable.** Its fixture-bound imports moved to the new
  `lib/taxonomy` item: the IUCN tables, the record types, and a `countryFlag`
  computed from the ISO code rather than read out of `birds.json`. `lib/data.ts`
  re-exports the moved names, so the review pages did not change at all.
- **The base-primitive regression is gone.** `checkbox` is an item itself, and
  `patterns` and `specimen-card` depend on the qualified address, so an install no
  longer overwrites a consumer's corrected file. The registry's other dependency
  edges were corrected against the real import graph while there: `patterns` never
  imported `@/lib/format`, and `layout` never imported `Chip`.
- **`lib/format.ts` is an item**, with `formatInteger` added for the four call
  sites that rounded to whole numbers. The platform's 26 hand-rolled
  `Intl.NumberFormat` definitions across 26 files are gone, and 27 files now
  import the shared module.
- **The ring contrast is fixed in both repositories.** `--ring` is now
  `oklch(0.58 0.021 106.9)`: 4.27:1 on the light background and 4.59:1 / 3.97:1 on
  the two dark surfaces, against 2.15:1 before. One value now serves both themes
  because it was measured against all four.

**Still open.**

- **`Chip` has no positive or negative overlay scrim.** `surface="overlay"` is a
  closed set of three appearances — `dark`, `light`, `highlight` — so a chip that
  needs to say *correct* or *incorrect* on a photograph has no tone to reach for.
  The platform's quiz result badge hit this: it kept the meaning in its check/X
  icon and took the `dark` scrim, which works but loses the colour cue the
  original had. Adding `positive` and `negative` scrims alongside `highlight`
  would close it.
- `formatDecimal` uses `maximumFractionDigits: 1` with no minimum, so a whole
  number renders as `4` where the platform previously showed `4.0`. That is a
  deliberate simplification, not an oversight: if a fixed decimal is genuinely
  wanted it belongs here as a parameter rather than as another local formatter.
- **The platform design guide is reconciled** (Step 5). Its three corrections
  are recorded as resolved rather than pending: the spacing collapse took all 406
  off-scale utilities to zero, chips run at the shared `Chip`'s `size-2.5`, and the
  light-only claim is qualified by the `.dark` block `mri-theme.css` actually ships.
  Its component-ownership section no longer describes the deleted
  `components/platform`, and it names `npm run audit:ui` rather than this
  repository's `audit:spacing`.
- `eslint` is pinned to `^9` here because `eslint-config-next@16.3.4` bundles an
  `eslint-plugin-react` incompatible with ESLint 10.

## 5. The composition layer

Sections 1–4 changed the platform's **vocabulary**. They did not change its
**grammar**, and on review the platform's own author could not tell the migrated
pages from the originals. That is a fair reading of the result, not a
misunderstanding of it: a conformance pass was run where a redesign was wanted.

The distinction that matters is that a shadcn component, a semantic token and a
shared formatter are all *lexical* — they fix what a thing is made of. Nothing in
v0.4.0 fixed *how a page is arranged*, so each route kept its own arrangement and
invented the pieces it was missing. This section closes that gap.

### The diagnosis, measured

Every figure below was read off the tree, not estimated.

- **Page shell padding is inherited, never defined.** `app/layout.tsx` wraps every
  route in a `page-card` with `sm:rounded-2xl sm:border` and **no padding**. The
  horizontal space comes from `PageContainer`'s `px-4 sm:px-6 lg:px-8` and the
  bottom from whatever the page passes, but **no page passes a top padding**, so
  content begins at 0px from the card's top border while the xeno-canto snapshot
  page ends at `pb-10`. Across 24 files using `PageContainer` there are **7
  distinct padding recipes**: `pt-3 pb-6 sm:pt-6 sm:pb-10`, `space-y-6 pb-10`,
  `pb-6 sm:pb-10`, `pb-6`, `pt-3`, `pt-4`, `space-y-4 pb-6`.
- **Cards nest.** 136 `<Card>` usages sit inside that page-level card.
- **The data-card header is hand-rolled 15 times.** `text-sm font-semibold
  tracking-tight` plus a truncated one-line description, four of them pinned with
  `min-h-[48px]`. `/patterns` documents this exact recipe — and its own specimen
  note concedes it was *"previously only recorded platform-side"*. It was promoted
  to the master as **prose**, with no component behind it, so `Panel` enforces none
  of the three rules the page states.
- **Three tables, three shapes, one page.** `/birds/xeno-canto/weekly-highlights/[snapshot]`
  renders a country table (plain header), a contributor list (`<ul>`, so no column
  headers at all) and a taxa table (**shaded sticky header**, `bg-muted/90
  backdrop-blur-xs shadow-xs`, plus magic `max-h-[310px]`/`max-h-[426px]`). The
  three also disagree on last-cell padding (`pr-4` vs `pr-3`), on `StatusBadge` vs
  `Badge`, and on 10/11/12px numerics. Across the platform: 16 files import the
  table primitive, 22 headers are plain, 2 carry a background.
- **The chart layer was never distributed.** `components/mri/charts.tsx` — 377
  lines, 8 compositions, `CHART_COLORS` — **is not in `registry.json`**, so the
  platform could never install it. All 8 platform chart files import `recharts`
  directly: two use `var(--chart-N)`, three carry their own rainbow hex maps, one
  draws with `stroke="#888888"`. **71 colour literals** live in these files.
- **Audio has two implementations and neither is here.** The quiz has
  `quiz-audio-player.tsx` — 132 lines, entirely on tokens (`bg-primary`,
  `bg-card`, `bg-muted`, `ring-ring`), and it is the player the platform's author
  singled out as looking right. `/birds/uploads` has `public/bird-review/`:
  `player.css` 343, `player.js` **1,506**, `transport.css` 205, `transport.js`
  151, `embed.css` 58, two HTML documents, ~2,900 lines in total, embedded through
  an iframe and driven by `postMessage`. Across those files: **95 colour
  literals and zero design tokens** — the single stray `var()` is its own
  `--spectrogram-plot-gutter`. It has no dark mode, so it renders as a
  light-grey document inside a themed page.
- **Tables and charts are allowed to span the full width.** Nothing limits a
  table to a readable number of columns or a row to one data surface, so the
  xeno-canto taxa table runs the full container width with four columns of which
  two are links, and the country table carries six. A table that needs every
  column to be useful is usually two tables.
- **The enforcement is not published either.** This repository ships
  `spacing-audit` — 84 lines, one rule. The platform has grown `audit-ui.mjs` —
  422 lines, six rules. They are different files. Anything else installing this
  registry gets the weak one.
- **The stylesheet exemption is doing more work than it admits.** The audit
  sanctions `player.css`, `transport.css` and `embed.css` by name. That was
  granted to stop the audit failing on the iframe, and it has since been covering
  95 colour literals and a complete absence of theming on the one surface where
  the platform's audio work actually lives.

The audit could not have caught any of it. Its six rules — spacing, chips, raw
tables, colour literals, banned imports, stylesheets — are all mechanical, and
composition is not a mechanical property. Two blind spots compounded it:

1. The colour rule reads **class-name string literals** and inline `style={{}}`
   only. A hex inside a plain data object (`{ start: "#3b82f6" }`) is invisible.
2. The earlier reconnaissance **saw** those palettes and set them aside by design:
   "the 143 colour literals were Recharts palettes in JS, not class names (8 are
   real)". That was a correct scoping call for a token-conformance pass and the
   wrong one for a design migration — the palettes are the largest single block of
   styling on the platform that no token governs.

### Decided

1. **The shell is a persistent left sidebar plus a top header.** Full route tree
   always visible, so the breadcrumb is genuinely redundant on deep routes and is
   deleted rather than restyled.
2. **The chart palette becomes a tokenised categorical ramp in this repository.**
   `charts.tsx`'s "at most three series" rule is right for the olive ramp and
   wrong for nine-country comparison: collapsing those to one hue makes countries
   indistinguishable, which is a legibility regression rather than consistency.
   The rule book is extended rather than ignored, and the 71 loose hex values
   become documented tokens.
3. **Two data surfaces per row, maximum.** A row holds two tables, or one table
   and one chart, or two charts — never three, and never one full-width table.
   This is a rule rather than a preference because a full-width table is how a
   table accumulates columns it does not need: if the data will not fit two-up,
   the answer is fewer columns or a second table, not more width. It goes in the
   audit, not only in prose.
4. **Audio is a first-class design-system concern, not a carve-out.** The split is
   between the *chrome* and the *instrument*:
   - **Chrome folds in.** Transport, scrub, timing and container become an
     `AudioPlayer` in this repository, built from the quiz player's design, since
     that is the one already on tokens and the one that reads correctly.
   - **The instrument stays, but stops being a stylistic island.** The
     spectrogram annotator is a WebGL and canvas application — shaders, a
     device-pixel-ratio canvas renderer, annotation hit-testing, drag-resize, a
     draft overlay, a modal, zoom and scroll, and a waveform overview strip. That
     is not a component and rewriting it in React is a rewrite of a working
     runtime, not a design task. It keeps its iframe, but it **consumes this
     repository's tokens** instead of 95 loose hex values, gains the dark theme,
     and its exemption shrinks to canvas geometry only.
   - **Audio gets rules.** Where the player appears, what the transport must
     contain, how it behaves on a photograph, and what the spectrogram is allowed
     to look like. Audio matters to this institute and currently has no rules at
     all.
5. **Quiz is not a special case.** The question screen's *player* is the reference
   for audio; its *screens* — sign-in, start and stats — are ordinary pages and
   get rebuilt on the shell and the shared compositions like everything else.
6. **Ruthlessness is authorised.** Content that does not conform may be dropped
   rather than restyled: tables deleted, columns cut, surfaces omitted. The
   platform has one user who has asked for the design system to win every
   disagreement. A page that cannot be expressed in the shared compositions is
   evidence about the page, not a reason for an exemption.

### Order of work

Each step has a gate. Do not start the next until it passes.

**Step 1 — the rule book, before any platform work.** Tag `v0.5.0`.

1. **Publish the real audit.** Move the platform's six-rule `audit-ui.mjs` here and
   ship it as a registry item, superseding `spacing-audit`. Keep the old item name
   resolving so existing installs do not break. This is the whole point of the
   repository: enforcement that only one consumer has is not a standard.
2. **Ship `DataCard`.** The data-card header recipe as a component: title that
   carries its count, one-line truncating description, optional right slot, and no
   uppercase eyebrow. The three rules the page states become the component's
   shape.
3. **Ship `TableCard`.** `Panel` + horizontal containment + optional `TableCaption`
   + footer strip, with a **plain** header. `/patterns` already prescribes this;
   it needs to be installable.
4. **Publish `charts.tsx`** as a registry item, and add the categorical ramp
   alongside `CHART_COLORS` — documented, named per series, and contrast-checked in
   both themes the way `--ring` was.
5. **Define the shell.** `PageContainer` gains the padding contract so no page
   passes its own again; add the shell primitives and the `--sidebar-*` tokens,
   which the theme does not have today (0 occurrences). `sidebar` from the preset
   ships no CSS, so the tokens must come from here or the component renders
   against undefined variables.
6. **Ship `AudioPlayer` and the audio rules.** Promote the quiz player's design —
   circle transport, replay with its key hint, scrub track, tabular time — into a
   token-based component with the playback state owned by the caller, so the quiz
   and the review tool drive the same chrome. Add the "Audio" rules section: where
   a player may appear, what the transport must contain, how the overlay variant
   behaves on a photograph.
7. **Add composition rules** to the audit: hand-rolled section header, table
   container or header treatment outside the shared composition, colour literals
   in data objects with no exemption path, more than two data surfaces in a row,
   and a design token used inside the spectrogram frame's stylesheets. Seed the
   ledger against today's counts so the rules ratchet down rather than blocking
   Step 2.

**Landed.** Eight rules became twelve — the six that existed, plus `headers`,
`tableHeaders`, `dataColours`, `twoUp` and `padding` (this repository runs clean on
all twelve with an empty ledger; the platform carries 145 seeded violations over 106
entries and may only shrink). Five things the plan did not anticipate:

1. **`DataCard` would have been a duplicate.** `Panel` took `count` and a
   truncating description instead, so the data-card header is the component's shape
   rather than a sibling of it. Adding a near-identical second card to the
   repository whose purpose is preventing drift would have been the drift.
2. **The sidebar-token claim in the diagnosis above was wrong.** The preset *does*
   define `--sidebar-*`, in `globals.css`. The platform has none because they were
   among the dead aliases trimmed during the migration. Checking properly found a
   worse problem than the one assumed: the preset's light `--sidebar-ring` is the
   `0.737` value already measured at 2.15:1 and replaced, and its
   `--sidebar-primary` is a second green, different from `--primary` in both
   themes. The tokens now live in `mri-theme.css`, aliasing values that are already
   measured.
3. **The bare-Phosphor defect reached the generated layer a fourth time.** The
   registry's `sheet.tsx` and `sidebar.tsx` both ship it. The generated layer stays
   exempt from every style rule, but a single targeted import rule now covers it,
   and `sheet` and `sidebar` are published as corrected items — `sidebar` depending
   on this repository's `sheet` rather than the preset's.
4. **The colour rule found a documentation defect the plan did not predict.**
   `/foundations` was still publishing the old `--ring`, so the token reference was
   lying about the token. Two files are exempt because a page that documents the
   palette must contain it, and both exemptions carry their reason.
5. **`twoUp` had to be narrowed before it could be trusted.** Its first version was
   file-level — a file rendering a surface may not declare a 3+ column grid — and
   fired 30 times on this repository, almost all of it the swatch and specimen grids
   a documentation site is made of. It is now a proximity check, which took the
   false positives to zero while still catching the real shape. On the platform it
   then found nothing, correctly: the wide grids there hold `MetricCard`s, which are
   a summary band and not data surfaces.

Two traps were added to `AGENT-RULES.md` along the way, both found by a build
failing rather than by review: a value imported from a `"use client"` module
arrives as a client-reference proxy (property reads work, `.map` does not), which is
why `lib/chart-colors.ts` exists; and the preset's `use-mobile` hook sets state in an
effect, which the React compiler lint rejects.

**Step 2 — replace the shell.**

Delete `Breadcrumb`, the page-level card, and the `sm:mt-3` / `pb-1.5` spacing
fudge. One header, one sidebar, one padding contract.

**Step 3 — flat pages, piloted on xeno-canto.**

`/birds/xeno-canto/weekly-highlights/[snapshot]` first, so the arrangement can be
judged before it is repeated 28 times. Then the sweep: `PageHeader`,
`SectionHeader`, `Panel`/`DataCard`, no card inside card, and no row carrying more
than two data surfaces.

**Step 4 — tables, ruthlessly.**

One `TableCard` everywhere, two-up by default. The three xeno-canto sections
first, then the remaining 13 files importing the primitive.
`text-emerald-600` in `weekly-country-breakdown.tsx:110` goes with them. Columns
and whole tables that do not earn their place are cut rather than restyled, and
`/birds/xeno-canto/weekly-highlights/[snapshot]` is the worked example: its
country table wants six columns and gets four, and the taxa table's two separate
Xeno-canto links collapse to one.

**Step 5 — charts.**

Install `charts.tsx`, move the 8 files off direct `recharts`, and resolve each
against the new ramp. This is the largest single block of work in the section and
the one most likely to change what the platform looks like.

**Step 6 — audio.**

Put `AudioPlayer` behind both the quiz and `/birds/uploads`, then tokenise the
spectrogram frame: replace its 95 hex literals with the MRI tokens, give it the
dark theme, and shrink its stylesheet exemption to canvas geometry. Rebuild the
quiz's sign-in, start and stats screens on the shell like any other page — the
question screen keeps its player and loses its special status.

**Step 7 — lock in.**

New rules fail the build, the ~10 e2e specs the shell change touches are
repointed, `docs/frontend-design-system.md` and `docs/mri-ui-rules.md` are
reconciled, `verify` is green in both repositories, and the platform takes a tag.

### Risks

- **The shell change is the one irreversible step.** It touches every route, the
  48-test e2e suite and the layout contract at once. It goes after Step 1 so the
  audit can see the result, and it is piloted before it is swept.
- **`sidebar` overwrites `components/ui/sheet.tsx`** (confirmed by dry run). The
  platform's mobile navigation depends on that file, so the shell step must
  re-verify the sheet's Base UI `render` usage rather than assume the overwrite is
  compatible.
- **Fixing composition will expose the chart palettes as the dominant remaining
  inconsistency.** Step 5 is not optional cleanup; if it is deferred the platform
  will look half-migrated, which is the state this section exists to end.
- **Tokenising the spectrogram frame is a styling change and must stay one.** The
  1,506-line runtime carries WebGL shaders, a device-pixel-ratio canvas renderer
  and annotation hit-testing, and it currently works. Step 6 replaces colours and
  adds a dark theme; it does not restructure the annotator. If a token cannot be
  expressed in the frame's stylesheets without touching the renderer, the token
  waits rather than the renderer being rewritten.
- **The two-up rule will delete content.** Enforcing it is a content decision as
  much as a layout one — the country table losing two columns means losing two
  figures a reader could previously see. Authorised, and recorded here so the
  deletions read as intended rather than as breakage.
- **Dropping the stylesheet exemption may fail Steps 2–6 mid-flight.** The frame's
  three stylesheets are currently sanctioned by name. Removing that sanction before
  the files are tokenised turns the audit red for the whole of Step 6, so the
  exemption is narrowed *after* tokenisation within the same step, not before it.
