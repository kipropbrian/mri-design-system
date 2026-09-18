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

## 2. Do this regardless, and soon

**Initialise git in this repo.** `projects/mri-design-system/` is not under
version control — it was untracked inside the platform repository, and the nested
`.git` was removed when it was first scaffolded. Nothing is recoverable: during
this work an editing mistake could not be reverted from history.

It is a standalone project now, so it should be its own repository with a first
commit. The longer it waits, the more there is to lose.

---

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

## 4. Phase 6 — registry packaging

**Blocked on one input: a hostname.** Nothing else needs it.

A folder of code is not something another repo can consume — it decays into
copy-paste. The shadcn CLI adds from remote registries, and `components.json`
already carries an empty `"registries": {}`.

1. Emit registry item JSON for `chip`, `panel`, `metric-card`, `filter-sidebar`,
   `status-path`, `specimen-card`, `data-state`, and the `mri-theme.css` token file.
2. Deploy the review site (Cloudflare, like the platform) to give the registry a
   stable origin.
3. Document the two-line adoption path:

```sh
npx shadcn@latest init --preset b6t6Ah1yi
npx shadcn@latest add https://<host>/r/chip.json
```

**Gate:** a throwaway Next app can `add` from the registry and render a chip that
matches `/rules` exactly.

---

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

- **No version control** (§2). The most urgent item here.
- **Phase 5 unanswered** (§1).
- **Registry hostname unknown** (§4).
- The platform design guide still carries three corrections that Phase 4 will
  resolve: "light-only interface" is false, `p-3.5` is off-scale, and its icon
  sizes conflict with the master's.
- `eslint` is pinned to `^9` in this repo because `eslint-config-next@16.3.4`
  bundles an `eslint-plugin-react` incompatible with ESLint 10.
