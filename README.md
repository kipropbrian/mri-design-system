# MRI design system

A shared interface language for MRI research tools, built on the shadcn preset
**`b6t6Ah1yi`** (`style: mira`, `theme: green`, `baseColor: olive`,
`chartColor: olive`, `radius: default`, `font: inter`, `fontLibrary: phosphor`).

This is a **review artifact**, not a production app: a self-contained Next.js
project that renders the preset's foundations and primitives, then layers the
page-level concepts MRI projects inherit on top — dashboards, catalogues, media
grids and practice tools — filled with real platform data.

## Review it locally

```sh
npm install
npm run dev -- --port 4311
# http://127.0.0.1:4311
```

Press <kbd>d</kbd> anywhere, or use the header control, to switch light/dark.

## What is in here

| Route | What it reviews |
| --- | --- |
| `/` | Scope, the decoded preset, adoption commands, house rules |
| `/rules` | **The three enforced rules**: space scale, chip system, image overlays |
| `/foundations` | Colour roles, chart ramp, type scale, fonts, radii, icons, MRI mark |
| `/components` | All 37 installed shadcn primitives with real content |
| `/charts` | ChartContainer wiring, five chart types, empty/loading states |
| `/patterns` | Page header, metric strip, data-card header, filter bar, table, media cards, data states, provenance |
| `/pages/platform` | Landing page composition (weekly watches + field tools) |
| `/pages/inaturalist` | Country-first audit dashboard |
| `/pages/ebird` | Regional media dashboard (eBird / Macaulay) |
| `/pages/xeno-canto` | Bioacoustic snapshot with snapshot navigation |
| `/pages/quiz` | Bird sound quiz: start → question → reveal + gates and history |

## The three rules

A design system is the small number of decisions a route author is not allowed
to make again. `/rules` documents all three and audits itself live.

### Space — eight steps, one job each

| Step | px | Utility | Its one job |
| --- | --- | --- | --- |
| 0.5 | 2 | `gap-0.5` | Glyph to glyph inside a chip |
| 1 | 4 | `gap-1` | Icon to label inside a control |
| 1.5 | 6 | `gap-1.5` | Chip to chip in a row |
| 2 | 8 | `gap-2` | Stacked text lines; label to value |
| 3 | 12 | `gap-3` · `--card-spacing` | Card padding; card-grid gutter |
| 4 | 16 | `gap-4` | Panel padding; large-block gutter |
| 6 | 24 | `gap-6` | Section heading to its content |
| 10 | 40 | `gap-10` | Between page sections |

Enforced by `npm run audit:spacing`, which extracts every class-list literal and
fails on anything outside the scale. Before it existed this app carried **120
off-scale utilities** — 27 × `gap-2.5`, 14 × `py-2.5`, 10 × `gap-8`. None were
decisions; they were drift. Four control-geometry paddings are allowed, each with
a written reason in `scripts/audit-spacing.mjs`.

Four rules go with the scale:

1. **Nothing is flush.** Every content edge keeps at least `--card-spacing`. The
   only exception is a photograph bleeding to a card's top, left and right edges.
2. **A card body is exactly `--card-spacing` on all four sides.**
3. **A card sizes to its content.** A flex column never distributes slack with
   `justify-between`; dead space means the content is wrong.
4. **One gutter: 12px.** `gap-2.5` is not available.

### Chips — one component, two surfaces

Every pill, badge, tag and status marker is `Chip`. Two sizes, decided by
surface, never by page:

- **flow** — 20px tall, 10px text — every chip in the page flow
- **overlay** — 22px tall, 11px text — chips on a photograph

Six tones (`neutral`, `primary`, `positive`, `warning`, `info`, `negative`). The
platform previously had **28 hand-rolled chip strings** across five text sizes
and four radii; this app had a filter chip at 24.5px/11px next to everything else
at 20px/10px. Both are gone. `/rules` measures the rendered DOM and reports any
chip outside the two sizes.

### Overlays — text on a photograph

1. **Every chip on a photograph carries its own scrim.** `black/70` with white, or
   `background/90` with foreground. A tinted or outline chip may never be placed
   on an image — that is what made the IUCN "LC" chip invisible on pale photos.
2. **At most two chips, one per top corner.** A third means the image is carrying
   data that belongs in the card body; `ChipRow` warns in development.
3. **Media facts on the image, record facts in the body.** Country and rarity are
   properties of the photograph. Verification status, IUCN category, counts and
   dates are properties of the record, so they go where the background is known.
4. **Attribution is always a bottom gradient** — `from-black/80 via-black/45`,
   minimum 32px tall.

### The MRI semantic extension

The preset ships one brand hue, one alarm hue and a monochrome olive ramp. A
research tool also reports at-risk status, provenance context and rarity, so
those roles are defined once in **`app/mri-theme.css`** — a separate file that a
preset re-apply cannot clobber and that other MRI projects can copy wholesale.

| Role | What it is for |
| --- | --- |
| `--info` | Provenance and context — neither good nor bad news |
| `--warning` | At-risk taxa, needs-review records, near-threshold values |
| `--notable` | Rarity. The "Global first" accent, now a real token |

**Each role has three values, because one colour cannot do three jobs:**

```
--warning             the solid fill        (solid chips, dots, bars)
--warning-foreground  ink ON that fill
--warning-ink         the role as text on a normal surface (tinted chip, eyebrow, link)
```

Skipping `-ink` is what breaks dark mode: a `--primary` dark enough to carry
white button text is far too dark to *be* text on a dark card. Before the ink
tier a positive chip measured 2.1:1 and the notable chip 1.2:1 — invisible.
`--primary-ink` and `--destructive-ink` do the same job for the two preset roles.

Verified by pixel-sampling every chip in both themes: **worst contrast 4.95:1,
all AA.** Success is deliberately *not* a separate role — in this preset the
brand colour is green and the positive state is green, so a second green would
recreate the ambiguity the tokens exist to remove.

### Status vocabulary

Aligned to the live platform: **`monitoring` gets no chip.** It is the default
state of a country first, so it renders as absence — a dash in a table, nothing on
a card. Only `stable` and `withdrawn` earn a chip.

## Fonts

The preset specifies `font: inter` and nothing else, so **Inter is what every
page renders** — that is also what the live platform uses. Monospace is not a
webfont: it is the platform's system stack (`ui-monospace, SFMono-Regular,
Menlo …`), used only for codes, ids, dates and paths. Four alternatives are
*loaded* so the picker can swap live; none of them is rendered unless chosen.

The rule that keeps type consistent:

- **Measures** — counts, scores, percentages, species totals — are Inter with
  `tabular-nums`. Never monospace.
- **Strings you copy or diff** — `inat-20260913`, `afpfly1`, `2025-12-24` — are
  monospace.

The header carries a **font picker** that swaps `--font-sans` across the whole
interface (headings, body, tables, charts) so the shortlist can be compared
live. It is preview-only and changes no preset token.

| Option | Note |
| --- | --- |
| **Inter** | Preset default · what the live platform uses |
| **Atkinson Hyperlegible** | Braille Institute · the legibility fallback for low-vision reading |
| Geist | Vercel · tighter, more geometric |
| IBM Plex Sans | IBM · technical, institutional |
| Source Sans 3 | Adobe · open, very high legibility |

Inter leads because the preset ships `font: inter` and the platform uses it.
Atkinson Hyperlegible is retained rather than dropped: the Braille Institute
designed it for low-vision readers, and an earlier MRI prototype defaulted to it.
It is offered in the picker, not made the default.

The choice is remembered in `localStorage`; `/foundations` shows the same four
faces side by side.

## Layout of the project

```
app/                     routes (see the table above)
components/ui/           the preset's shadcn primitives — do not hand-edit semantics
components/shell/        MRI compositions built from those primitives
  chips.tsx              the one chip: two surfaces, seven tones, overlay scrims
  chip-audit.tsx         measures every rendered chip, used by /rules
  charts.tsx             Recharts compositions on the olive ramp
  layout.tsx             PageContainer, PageHeader, SectionHeader, Specimen
  patterns.tsx           Panel, MetricCard, StatusBadge, FilterSidebar,
                         StatusPath, RecordChange, data states, skeletons
  specimen-card.tsx      Observation and bird-media cards
  quiz-preview.tsx       Interactive quiz state machine
PLAN.md                  what is left to do, led by the open decision
RESCUE-NOTES.md          what the superseded prototype held, and what it cost
lib/data/                JSON extracted from live platform artifacts
lib/data.ts              Typed access to that JSON
lib/format.ts            Number, date and label formatting
scripts/                 Data extraction, asset preparation, spacing audit
public/brand/            MRI mark, lockup and favicons
public/providers/        iNaturalist, eBird, GBIF, Xeno-canto, AviList marks
```

## Regenerating the data and assets

The review site shows real content. Both generators read from the parent
platform repo (read-only) and are safe to re-run:

```sh
node scripts/extract-platform-data.mjs   # lib/data/*.json
python3 scripts/prepare-assets.py        # public/brand, public/providers, public/taxa
```

`prepare-assets.py` removes the flat cream plate from the published MRI artwork
by alpha-unmixing each pixel, then derives a white knockout for dark mode and a
square emblem crop for the header and favicon.

Sources:

- `public/inaturalist/country-firsts/snapshots/inat-20260913.json`
- `public/birds/east-african-bird-list/east_african_bird_list.json`
- `public/birds/species-details/*.json`
- `maiyoinstitute.org/public/mri-logo.png`

## Where this intentionally deviates from the raw preset output

Everything below is a deliberate, reviewable change; nothing else has been
retouched.

1. **Phosphor imports use the SSR entry.** `shadcn add` writes
   `@phosphor-icons/react`, whose module body calls `createContext`. That breaks
   any Server Component importing a generated primitive. All imports were
   switched to `@phosphor-icons/react/dist/ssr`, the same convention the
   platform repo already uses. Affected files: `pagination`, `sheet`, `sonner`,
   `accordion`, `native-select`, `breadcrumb`, `dialog`, `checkbox`, `spinner`,
   `dropdown-menu`, `select`.
2. **`nativeButton={false}` on anchor and link buttons.** Base UI warns when
   `render` produces a non-`<button>`; the template sets the flag wherever a
   button or a `SheetClose` renders a link.
3. **`turbopack.root` is pinned** in `next.config.ts` because this project lives
   inside a repository that has a second lockfile.
4. **`@next/next/no-img-element` is off.** Provider imagery is loaded directly
   from the providers' CDNs, matching current platform behaviour.
5. **Root metadata title.** `/` shares its route segment with the root layout, so
   `title.template` does not apply there and the home route sets an absolute
   title. All other routes pick up the template.
6. **`eslint` is pinned to `^9`.** `eslint-config-next@16.3.4` bundles an
   `eslint-plugin-react` that is incompatible with ESLint 10.
7. **A review-only block was appended to `globals.css`** for the font switcher
   (`html[data-font="…"] { --font-sans: … }`) and to pin `--font-mono` to the
   platform's system stack. Everything above that block is the preset's
   generated stylesheet, unmodified.
8. **`p-(--card-spacing)` is not emitted by Tailwind here.** Card bodies use the
   preset's own split form instead — the built-in `px-(--card-spacing)` plus an
   explicit `py-(--card-spacing)`. Getting this wrong leaves media-card content
   flush against the card's bottom edge.
9. **`app/mri-theme.css` adds the semantic state roles** (`info`, `warning`,
   `notable`) and the readable `-ink` tier. `globals.css` imports it alongside the
   other imports; everything else in `globals.css` is preset output.
10. **`Chip` is a `<span>`, not the preset `Badge`.** This is the one place the
   preset component cannot be used as-is: `Badge`'s variants carry
   `dark:bg-input/30`, and Tailwind compiles `dark:` with `:is(.dark *)`, which
   adds a class of specificity. A dark variant therefore always beats a base
   utility, and tailwind-merge will not remove it (different conflict groups), so
   any background passed to `<Badge variant="outline" className="bg-...">` is
   silently replaced by a grey tint in dark mode. `Chip` owns its class string;
   the preset `Badge` is untouched and still shown on `/components`.


## Review points worth a decision

- **The chart ramp is monochrome.** `chartColor: olive` makes `--chart-1 … 5` a
  single light-to-dark olive ramp, not five hues. This template caps charts at
  three series and always ships a labelled legend. If MRI wants categorical
  colour, change `chartColor` in the preset — one line, not per-chart overrides.
- **`background`, `card` and `popover` are all pure white.** Panels are separated
  by `ring-1 ring-foreground/10` rather than fill contrast. It reads clean, but
  layered surfaces are subtle; `/foundations` shows the full token set.
- **`--radius` is `0.625rem` with a proportional scale**, so the interface is
  rounder than the current platform. Change one value to shift everything.
- **The quiz has no audio.** Playback is simulated so the review is about the
  interface, not the media runtime. Everything else on the page is real.
- **Typography parity with the platform.** The first cut of this template set
  metric values and table counts in monospace, which is why it read differently
  from the platform. That is fixed: measures are Inter + `tabular-nums`, and mono
  is now only codes, ids, dates and paths. Check `/foundations` to confirm.
- **The semantic extension is the top thing to review.** `--info`, `--warning`
  and `--notable` are MRI additions, not preset output. If you disagree with a
  hue it is one line in `app/mri-theme.css` — and that same file is what you hand
  to the next MRI project.

## Adding components

```sh
npx shadcn@latest add <component>
```

After adding, fix the Phosphor import to `/dist/ssr` (point 1 above) and run
`npm run typecheck`.

Base UI's `MenuGroupLabel` also requires group context — a `DropdownMenuLabel`
placed directly in `DropdownMenuContent` throws and the menu never opens. Wrap it
in a `DropdownMenuGroup` or a `DropdownMenuRadioGroup`.
