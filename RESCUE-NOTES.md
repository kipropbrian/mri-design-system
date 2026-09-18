# Phase 0 — rescue notes

Produced before anything is deleted. Two sources were audited: the superseded
framework-free prototype at `projects/design-principles/`, and the platform's
`docs/frontend-design-system.md`. These lists feed Phase 3 (the design guide
rewrite) and Phase 4 (landing the additive layer).

**Nothing has been deleted.**

---

## Part A — the old prototype (`projects/design-principles`)

### Git state

Own repo, branch `main`, **zero commits**, every file untracked. There is no
history to lose and nothing was ever reviewed. Safe to trash once Part A and B
are written down.

### What it validates

Four decisions the new system arrived at independently. Worth recording because
independent agreement is evidence:

| Old prototype | New system |
| --- | --- |
| `--info`, `--info-soft`, `--warning`, `--warning-soft` as first-class roles | Same two roles, plus `--notable` |
| `.badge--info / --positive / --warning / --negative / --outline` | `Chip` tones: neutral, primary, positive, info, warning, notable, negative |
| Radius `0.375 / 0.5 / 0.625 / 0.875rem` | Preset's proportional scale: `0.625 × 0.6 / 0.8 / 1.0 / 1.4` — **identical** |
| `--content-max: 80rem`, `--header-height: 3.5rem` | `max-w-7xl`, `h-14` — identical |
| `.quick-filter-row` = chips + result count on one row | The filter ribbon on `/patterns` |

### What it contains that the new system does not

Ordered by how much I think it matters.

**1. The default typeface was Atkinson Hyperlegible Next, not Inter.**

```css
--font-sans: "Atkinson Hyperlegible Next", Inter, ui-sans-serif, …;
```
with Inter and IBM Plex Sans as switchable alternatives via `data-font`, and
`localStorage` defaulting to `"atkinson"`. The Braille Institute designed
Atkinson for low-vision legibility — a deliberate choice for a scientific
workbench.

The new template defaults to Inter because the preset says `font: inter`, and
**does not load Atkinson at all**. This is the single biggest decision the
rebuild lost. It is also the easiest to restore: one entry in
`lib/font-preference.ts` and one `next/font` import.

*Decision needed:* does MRI want a legibility-first default that differs from the
preset, or preset fidelity? The old prototype chose legibility.

**2. `.filter-panel` — a persistent desktop filter sidebar.**

The old prototype shipped *both* filter patterns: `.filter-ribbon` (compact
horizontal) and `.filter-panel` (a sidebar card with `fieldset`/`legend` groups,
checkbox rows, and per-option counts). The new template built only the ribbon and
the mobile sheet.

The platform needs both: `/metadata` and `/inaturalist/country-firsts` use sidebars
today. **Gap — the master has no documented sidebar pattern.**

**3. `.history-mark` / `.observation-card--history` / `.status-path`.**

A distinct card treatment for "this record changed": a circular warning-toned
mark, a title, a body line, and a **status path** rendering
`monitoring → stable` as pills.

The new `ObservationCard` has the verification chip but no previous→current
treatment. The live platform *does* have this data (`latestChange.previous_status`
→ `status`, `TRANSITION_LABELS`) and the new template did not port it.
**Gap.**

**4. `.delta-strip` — a borderless metric strip.**

A 4-up strip using left borders and no card chrome, with a `.is-active` state for
clickable metric cells. The new `MetricStrip` is card-based only. Minor, but the
borderless variant is useful inside an existing panel.

**5. `--border-strong` as a second border weight.**

Old: `--border: #ded9cf`, `--border-strong: #cbc5bb` (also `--input`). The preset
collapses `--border` and `--input` to one value and uses `ring-foreground/10` for
card edges. Minor; the ring approach covers it.

**6. `.callout--info` / `.callout--warning`.**

A three-column callout (icon | body | action) with info and warning tones. The
new system uses the preset `Alert` plus the notable note. Functionally covered,
but the paired info/warning callout vocabulary is worth keeping in mind.

### What is superseded and should not be ported

- The entire 61KB `styles.css`. The preset owns this now.
- `--primary-hover` (the preset uses `hover:bg-primary/80`).
- `--shadow-xs/sm/md` for in-flow surfaces. The preset separates surfaces with
  `ring-1 ring-foreground/10`; shadows are overlay-only. This was a deliberate
  change and it is the right one.
- `.skeleton-*` shimmer keyframes — the preset `Skeleton` uses `animate-pulse`
  with `motion-reduce:animate-none`, which the old version did not honour.
- `.donut` built from `conic-gradient` — Recharts now.

### One hue difference worth a look

| Role | Old prototype | New extension |
| --- | --- | --- |
| `--info` | `#356f94` — muted, teal-leaning | `oklch(0.52 0.15 252)` — saturated, purer blue |
| `--destructive` | `#a83f2c` — terracotta | preset `oklch(0.577 0.245 27.325)` — pure red |
| `--warning` | `#a76b08` | `oklch(0.48 0.12 60)` ink — same family |

The old palette was uniformly warm and desaturated (terracotta, olive, amber). The
new one inherits the preset's more saturated red and adds a bluer info. **If the
earthy character was deliberate, `--info` is the one to revisit** — it is the only
place the new extension leaves that family.

---

## Part B — `docs/frontend-design-system.md` (216 lines)

Sorted into three buckets. This is the input to Phase 3.

### B1. Superseded — the master now owns this

| Section (lines) | Superseded by |
| --- | --- |
| Intro (3) — preset `b1FkvFxpY`, "semantic values live in `app/globals.css`" | The master's preset, token model and `mri-theme.css` — **after migration only** |
| Density & Compact Mode (5–12) — `p-4`/`p-3.5` card padding, `gap-2 py-4 px-4` metric cards, `h-8 px-3 text-xs` buttons | `--card-spacing`, `MetricCard`, preset button sizes |
| Typography (26–52) — the whole scale, headings, button type, `font-serif italic` for taxa | The master's type scale and `/foundations` |
| Page Container & Widescreen (107–114) | `PageContainer` `wide`/`default`/`reading` |
| Media & Specimen Imagery (134–139) — aspect ratios, hover zoom, attribution gradient, status banners | The master's overlay contract, which is stricter (scrim required, max two chips) |
| Updating shadcn (159–167) — `apply --preset b1FkvFxpY` | Needs rewriting to point at the master |
| Icon sizes (24) — `size-3.5` / `size-4` / `size-5` | **Conflict**: the master uses `size-2.5` in chips, `size-3` inline, `size-3.5` in buttons. Reconcile in Phase 3. |

**Two direct contradictions to resolve in Phase 3, not silently drop:**

1. The doc mandates `p-3.5` on mobile; the master's spacing audit **bans**
   `p-3.5` as off-scale (the scale is 12/16px).
2. The doc says "It is a light-only interface." The master supports dark mode and
   the preset ships a `.dark` block. **This line is now false.**

### B2. Platform delta — still true, and *not* in the master

This is the important bucket. Deleting the doc without carrying these forward
loses them.

| Section (lines) | Why it stays platform-side |
| --- | --- |
| **Skeleton Loading & Zero-CLS (175–216, ~40 lines)** | The master has data states and skeletons, but **not** the zero-CLS contract, the "every async route exports `loading.tsx`" rule, the `aria-busy`/`aria-label` skeleton contract, or the structural-parity rules. **Largest genuinely-platform-specific chunk.** |
| **Root base size 15px (31–36)** | A platform typographic decision; the master inherits the preset's default. |
| **Filter ergonomics (14–18)** | Mobile sheet with active counter, "results visible immediately on load", desktop `w-64`/`w-72` sidebars. Partly in the master; the sidebar half is missing (see A2). |
| **Data Card Header Standard (54–105)** | Mostly in the master's `/patterns`, **plus three rules it lacks**: `min-h-[48px]` for cross-card row alignment; the ~40-character description limit; "no uppercase eyebrow inside a data card". **Port these into the master.** |
| **Multi-Column / grid occupancy (116–132)** | The "let the widest table span the remaining columns, and order the DOM so it comes last" rule. Domain-specific layout craft. |
| **Component ownership (141–149)** | The platform's folder contract (`components/ui` vs `components/platform` vs route components). Needs one amendment: `Chip` is a span, not the preset Badge. |
| **Interaction & accessibility (151–153)** | WCAG AA, 36px touch targets, no duplicate landmarks. The master now *measures* AA for chips; the rest stays. |
| **Responsive standard (155–157)** | Keep. |
| **Regional overview dashboards (169–173)** | Domain rules: coverage is not abundance; observation-year ≠ upload-year; no composite readiness scores. Cannot live in a generic master. |
| **Taxa formatting (52)** | `font-serif italic` for binomials. Arguably belongs in the master. **Recommend promoting.** |

### B3. Dead

| Line | Why |
| --- | --- |
| 3 — "It is a light-only interface." | False since dark mode. |
| 3 — preset `b1FkvFxpY` | Superseded by decision, not by error. |
| 11 — "micro-badges (`size-5.5` or `h-5 text-[10px]`)" | Superseded by `Chip`, which fixes both at 20px/10px. |
| 46 — eyebrow `text-[10px]` or `text-[11px]` | The master fixes this at `text-[0.625rem]` = 10px. Pick one. |

---

## Decisions Phase 0 surfaces

1. **Default typeface**: Atkinson Hyperlegible (old choice) or Inter (preset)?
2. **`--info` hue**: revert toward the old muted teal `#356f94`, or keep the
   saturated preset-adjacent blue?
3. **Promote two rules into the master** rather than leaving them platform-side:
   the binomial `font-serif italic` rule, and the data-card header's
   `min-h-[48px]` + 40-char description rules.
4. **Add two missing patterns to the master**: the persistent desktop filter
   sidebar, and the previous→current status path.

All four are for the Phase 4 discussion, not blockers for Phases 1–3.
