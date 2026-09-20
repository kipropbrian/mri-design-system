#!/usr/bin/env node
/**
 * MRI UI audit — the enforcement harness.
 *
 * A design system is only real if a machine checks it. These rules are the ones a
 * human reviewer cannot hold in their head across dozens of routes, so they are
 * extracted from the class strings in the source and checked here.
 *
 * The rules are described in `docs/mri-ui-rules.md`; the reasoning is in the wiki
 * page `concepts/mri-design-system`.
 *
 * ## Modes
 *
 *   node scripts/audit-ui.mjs
 *       Fail on any violation not in the baseline, and fail on any baseline
 *       entry that no longer occurs.
 *
 *   node scripts/audit-ui.mjs --report
 *       Print the whole ledger. Always exits 0. This is the triage view.
 *
 *   node scripts/audit-ui.mjs --update-baseline
 *       Rewrite the ledger from the tree. Refuses to grow the total unless
 *       --force is also passed.
 *
 *   node scripts/audit-ui.mjs --root <dir>
 *       Audit another MRI tree, or a test fixture, instead of this repository.
 *
 * ## Why a baseline
 *
 * A tree that adopts this audit usually cannot satisfy it immediately, and fixing
 * everything first would block the adoption. The baseline records what is already
 * there, and the second half of the check is what keeps the ledger honest: an
 * entry that stops occurring is an **error**. The ledger can only shrink, so
 * existing drift is paid down rather than renamed.
 *
 * ## Configuration
 *
 * Everything project-specific lives in `scripts/audit-ui.config.json` beside this
 * file, never in this file. A rule's *rules* are shared; which files are allowed
 * to break them is a property of the project. A tree with no config still gets
 * audited on the defaults below, and the three allow-lists **merge** with those
 * defaults, so a config can only ever add an exemption. `scanDirs`, `generated`
 * and `baseline` replace.
 *
 *   {
 *     "scanDirs":         ["app", "components"],
 *     "generated":        ["components/ui/", "components/mri/"],
 *     "baseline":         "scripts/audit-baseline.json",
 *     "spacingAllowed":   { "pr-14": "why this one is geometry, not rhythm" },
 *     "allowedCss":       { "public/x/player.css": "why this stylesheet exists" },
 *     "allowedColourFiles": { "app/opengraph-image.tsx": "why colour is literal here" },
 *     "tableAllowed":     { "x/skeleton.tsx": "why this table is not a composition" },
 *     "pageShellAllowed": { "components/shell/x.tsx": "why this file owns its own gutter" }
 *   }
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, basename, resolve } from "node:path";

const argv = process.argv.slice(2);
/** `--root` lets the audit run against another MRI tree, and against fixtures. */
const rootFlag = argv.indexOf("--root");
const ROOT = rootFlag === -1 ? new URL("..", import.meta.url).pathname : resolve(argv[rootFlag + 1]);

/* ------------------------------------------------------------------- config */

/**
 * Defaults are deliberately permissive about *what* is scanned and strict about
 * what is allowed: an unconfigured tree gets the full rule set and no exemptions
 * beyond the two files every MRI app has.
 */
const DEFAULTS = {
  scanDirs: ["app", "components"],
  generated: ["components/ui/", "components/mri/"],
  baseline: "scripts/audit-baseline.json",

  /** Control geometry that is not layout rhythm, each with its reason. */
  spacingAllowed: {
    "pl-8": "search input: 14px icon plus its 8px inset at the larger control size",
    "px-8": "page shell gutter at lg (32px)",
    "pl-7": "text aligned past the 24px avatar or icon it sits under",
    "pr-7": "input clearance for a trailing affordance (clear button or select caret)",
    "pr-8": "input and sheet-header clearance for a trailing control",
    "pr-14": "a sheet header making room for its close button",
  },

  /** Every stylesheet, with its reason. There is no other way to add one. */
  allowedCss: {
    "app/globals.css": "the Tailwind entry point and design tokens",
    "app/mri-theme.css":
      "the MRI semantic colour extension (info / warning / notable and the -ink tier), installed from the design-system registry",
  },

  /** Files where a colour literal cannot be avoided, with the reason. */
  allowedColourFiles: {},

  /** Files where a raw <table> is the right element, with the reason. */
  tableAllowed: {},

  /** Files that are outside PageContainer by construction and own a gutter. */
  pageShellAllowed: {},
};

function loadConfig() {
  const path = join(ROOT, "scripts", "audit-ui.config.json");
  if (!existsSync(path)) return DEFAULTS;
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`✗ scripts/audit-ui.config.json is not valid JSON: ${error.message}`);
    process.exit(1);
  }
  // The three allow-lists merge rather than replace, so adding a config can only
  // ever *add* an exemption. A project that writes one for its own reasons must
  // not silently lose the shared ones, which is a footgun with no upside: an
  // exemption nobody wants is visible in the diff that added it.
  return {
    ...DEFAULTS,
    ...raw,
    spacingAllowed: { ...DEFAULTS.spacingAllowed, ...(raw.spacingAllowed ?? {}) },
    allowedCss: { ...DEFAULTS.allowedCss, ...(raw.allowedCss ?? {}) },
    allowedColourFiles: { ...DEFAULTS.allowedColourFiles, ...(raw.allowedColourFiles ?? {}) },
    tableAllowed: { ...DEFAULTS.tableAllowed, ...(raw.tableAllowed ?? {}) },
    pageShellAllowed: { ...DEFAULTS.pageShellAllowed, ...(raw.pageShellAllowed ?? {}) },
  };
}

const CONFIG = loadConfig();
const BASELINE = join(ROOT, CONFIG.baseline);

/**
 * Source we own. `components/ui` is generated by shadcn and `components/mri` is
 * installed from the MRI design-system registry, so auditing them here would
 * report upstream's decisions as local drift — and would fight every reinstall.
 * The design system audits its own layer.
 */
const SCAN_DIRS = CONFIG.scanDirs;
const GENERATED = CONFIG.generated;

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".open-next",
  ".wrangler",
  "dist",
  "coverage",
  ".git",
]);

/* ------------------------------------------------------------------ rules */

/** 8 steps, one job each. Anything else is drift, not a decision. */
const SPACING_SCALE = new Set(["0", "0.5", "1", "1.5", "2", "3", "4", "6", "10"]);
// Margin is on the same scale as padding and gap, and was simply not scanned: the
// rule covered `gap`, `p*` and `space-y` and left `m*` alone, so `mt-7` (28px)
// and `mt-8` (32px) sat in the platform next to a scale whose largest step below
// the page rhythm is 24px. `mx-auto` is untouched: the pattern requires a number.
const SPACING_UTILITY = /(?<![\w-])(gap|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|space-x|space-y)-(\d+(?:\.\d+)?)(?![\d.])/g;
const SPACING_ALLOWED = new Map(Object.entries(CONFIG.spacingAllowed));

/** The one chip module owns every chip-shaped class string. */
const CHIP_MODULE = "chips.tsx";
const CHIP_SIGNATURE = (literal) =>
  /rounded-full/.test(literal) &&
  /\btext-(xs|\[1[01]px\]|\[10px\])/.test(literal) &&
  /\bpx-(1|1\.5|2|2\.5|3)\b/.test(literal) &&
  /inline-flex|items-center/.test(literal);

/** A raw table element is allowed only in the shared composition. */
const TABLE_COMPOSITION = "components/ui/table.tsx";

const ALLOWED_CSS = new Map(Object.entries(CONFIG.allowedCss));
const ALLOWED_COLOUR_FILES = new Map(Object.entries(CONFIG.allowedColourFiles));
const TABLE_ALLOWED = new Map(Object.entries(CONFIG.tableAllowed));
const PAGE_SHELL_ALLOWED = new Map(Object.entries(CONFIG.pageShellAllowed));

/** The named Tailwind palette, which has no business in an MRI interface. */
const PALETTE_COLOUR =
  /(?<![\w-])(?:[a-z0-9]+:)*(?:bg|text|border|ring|from|via|to|fill|stroke|outline|divide|decoration|accent|caret|placeholder|shadow)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d{1,3})?\b/g;

/** A colour is a token, never a value. */
const ARBITRARY_COLOUR =
  /(?<![\w-])(?:bg|text|border|from|via|to|ring|fill|stroke|outline|divide|decoration|accent|caret|placeholder|shadow)-\[[^\]]*(?:#[0-9a-fA-F]{3,8}|rgba?\(|oklch\()/g;
const INLINE_COLOUR_STYLE = /style=\{\{[^}]*?(#[0-9a-fA-F]{3,8}|rgba?\(|oklch\()[^}]*?\}\}/g;

/** Icons come from Phosphor, through the SSR entry, or not at all. */
const BANNED_IMPORTS = /^\s*(lucide-react|radix-ui|@radix-ui\/[^"']*|@base-ui\/react(?:\/[^"']*)?|react-icons(?:\/[^"']*)?|@heroicons\/[^"']*|@tabler\/[^"']*)$/;
const IMPORT_SOURCE = /(?:from|require\()\s*["']([^"']+)["']/g;

/* ----------------------------------------------------------------- plumbing */

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let isDirectory;
    try {
      isDirectory = statSync(full).isDirectory();
    } catch {
      // `readdir` succeeding does not mean `stat` will. macOS denies some paths
      // outright, and `--root` means this can be pointed at a tree the process has
      // no business reading. A directory that cannot be stat'd is one that cannot be
      // audited, so skip it rather than crashing the whole run.
      continue;
    }
    if (isDirectory) yield* walk(full);
    else yield full;
  }
}

/**
 * String literals only: prose may name a banned value while explaining it.
 *
 * "Prose" means **comments**, and for a long time this did not mean that. It was a
 * single regex over the raw source, so a documentation comment that named the class it
 * was warning about — in backticks, which is how these files are written — registered
 * as a template literal and was reported as the drift it described. Rewriting
 * `/birds` produced four violations from the comment explaining what the rewrite had
 * removed.
 *
 * The docstring was right and the implementation was wrong. So this walks the source
 * and skips `//` and `/* *\/` spans, carrying just enough state to know that a `//`
 * inside a string is not a comment and a quote inside a comment is not a string.
 *
 * Only `"` and `` ` `` delimit a literal, as before: a single quote is far more often
 * an apostrophe in JSX text than the start of a string in this codebase, and treating
 * it as a delimiter would swallow the rest of a paragraph.
 */
function* literals(source) {
  const length = source.length;
  let index = 0;
  while (index < length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "/" && next === "/") {
      const end = source.indexOf("\n", index);
      index = end === -1 ? length : end + 1;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? length : end + 2;
      continue;
    }
    if (char === '"' || char === "`") {
      const quote = char;
      let cursor = index + 1;
      let value = "";
      while (cursor < length) {
        if (source[cursor] === "\\") {
          value += source[cursor] + (source[cursor + 1] ?? "");
          cursor += 2;
          continue;
        }
        if (source[cursor] === quote) break;
        value += source[cursor];
        cursor += 1;
      }
      if (value) yield { literal: value, line: source.slice(0, index).split("\n").length };
      index = cursor + 1;
      continue;
    }
    index += 1;
  }
}

/**
 * The source with every comment span blanked out, offsets preserved.
 *
 * `literals` skips comments because prose may name a value it forbids. The structural
 * rules need the same treatment for the same reason and a different symptom: the
 * `singleH1` rule counted an `<h1>` written inside `PageHeader`'s own docstring, and
 * `cardInCard` would count a `<Card>` named in an example. Blanking rather than
 * removing keeps every index — and therefore every reported line number — correct.
 */
function stripComments(source) {
  const out = source.split("");
  const length = source.length;
  let index = 0;
  while (index < length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === "/" && next === "/") {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? length : end;
      for (let i = index; i < stop; i++) out[i] = " ";
      index = stop;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? length : end + 2;
      for (let i = index; i < stop; i++) if (out[i] !== "\n") out[i] = " ";
      index = stop;
      continue;
    }
    if (char === '"' || char === "`") {
      const quote = char;
      let cursor = index + 1;
      while (cursor < length) {
        if (source[cursor] === "\\") { cursor += 2; continue; }
        if (source[cursor] === quote) break;
        cursor += 1;
      }
      index = cursor + 1;
      continue;
    }
    index += 1;
  }
  return out.join("");
}

/**
 * Whether the import statement containing `index` imports only types.
 *
 * A `import type { Icon } from "@phosphor-icons/react/dist/lib/types"` is erased
 * before the module graph is built, so it cannot call `createContext` and cannot
 * break a Server Component. The icon rules exist to catch a value import, and
 * flagging a type import is the false positive that trains people to write
 * exemptions — so the distinction is made explicitly rather than by widening an
 * allow-list.
 */
function isTypeOnlyImport(source, index) {
  const start = Math.max(0, source.lastIndexOf("import", index));
  const statement = source.slice(start, index);
  if (/^import\s+type\b/.test(statement)) return true;
  const braces = statement.match(/\{([\s\S]*)$/);
  if (braces) {
    const names = braces[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length > 0 && names.every((name) => /^type\s/.test(name))) return true;
  }
  return false;
}

const lineOf = (source, index) => source.slice(0, index).split("\n").length;
const isGenerated = (rel) => GENERATED.some((prefix) => rel.startsWith(prefix));

const RULES = {
  spacing: {
    title: "off-scale spacing",
    hint: "use one of: 0 / 0.5 / 1 / 1.5 / 2 / 3 / 4 / 6 / 10 — and prefer gap on a grid over margin on a child",
    scan(rel, source) {
      const hits = [];
      for (const { literal, line } of literals(source)) {
        for (const util of literal.matchAll(SPACING_UTILITY)) {
          if (SPACING_SCALE.has(util[2])) continue;
          const token = `${util[1]}-${util[2]}`;
          if (SPACING_ALLOWED.has(token)) continue;
          hits.push({ line, token });
        }
      }
      return hits;
    },
  },

  chips: {
    title: "hand-rolled chip",
    hint: "use <Chip> from components/mri/chips.tsx",
    scan(rel, source) {
      if (basename(rel) === CHIP_MODULE) return [];
      const hits = [];
      for (const { literal, line } of literals(source)) {
        if (CHIP_SIGNATURE(literal)) hits.push({ line, token: "chip-shaped class string" });
      }
      return hits;
    },
  },

  tables: {
    title: "raw <table>",
    hint: "use the shared table composition in components/ui/table.tsx",
    scan(rel, source) {
      if (rel === TABLE_COMPOSITION || TABLE_ALLOWED.has(rel)) return [];
      const hits = [];
      for (const match of source.matchAll(/<table[\s>]/g)) {
        hits.push({ line: lineOf(source, match.index), token: "<table>" });
      }
      return hits;
    },
  },

  tokens: {
    title: "colour literal in a class name",
    hint: "use a semantic token (bg-background, text-primary, var(--warning-ink) …)",
    scan(rel, source) {
      if (ALLOWED_COLOUR_FILES.has(rel)) return [];
      const hits = [];
      for (const { literal, line } of literals(source)) {
        for (const match of literal.matchAll(ARBITRARY_COLOUR)) {
          hits.push({ line, token: match[0] });
        }
      }
      for (const match of source.matchAll(INLINE_COLOUR_STYLE)) {
        hits.push({ line: lineOf(source, match.index), token: "inline colour style" });
      }
      return hits;
    },
  },

  icons: {
    title: "banned import",
    hint: "icons come from @phosphor-icons/react/dist/ssr; UI primitives from components/ui",
    scan(rel, source) {
      const hits = [];
      for (const match of source.matchAll(IMPORT_SOURCE)) {
        const spec = match[1];
        const line = lineOf(source, match.index);
        if (isTypeOnlyImport(source, match.index)) continue;
        if (spec.startsWith("@phosphor-icons/react") && !spec.includes("/dist/ssr")) {
          hits.push({ line, token: spec });
          continue;
        }
        if (BANNED_IMPORTS.test(spec)) hits.push({ line, token: spec });
      }
      return hits;
    },
  },

  /**
   * The data-card header is `Panel`'s shape, not a recipe to retype.
   *
   * Fifteen files hand-rolled it before this rule existed, four of them pinning a
   * `min-h-[48px]` to keep row heights level — which is the component's job and which
   * they each got slightly wrong. The signature is `font-semibold` + `tracking-tight`
   * at a **card** size.
   *
   * The size qualifier is not decoration. `font-semibold tracking-tight` is also how a
   * page's own headings are written, and without it this rule flagged twelve of them —
   * `/about`'s five editorial section headings, the legal pages, the not-found page.
   * Those are the page's outline rather than a card's, they are legitimately larger,
   * and telling an author to wrap a page heading in `Panel` is telling them something
   * wrong. A card header is `text-sm` or smaller; prose and page headings are `text-lg`
   * upward. A legal document's section heading and a card's title can otherwise look
   * identical to a class-string scan, and the one at `text-lg` is the document's.
   */
  headers: {
    title: "hand-rolled data-card header",
    hint: "use <Panel title count description> or <TableCard> from components/mri/patterns.tsx",
    scan(rel, source) {
      const PAGE_HEADING = /\b(?:sm:|md:|lg:)?text-(?:lg|xl|2xl|3xl|4xl|5xl)\b/;
      const hits = [];
      for (const { literal, line } of literals(source)) {
        if (!/\bfont-semibold\b/.test(literal)) continue;
        if (!/\btracking-tight\b/.test(literal)) continue;
        if (PAGE_HEADING.test(literal)) continue;
        hits.push({ line, token: "data-card header class string" });
      }
      return hits;
    },
  },

  /**
   * A table lives in a `TableCard`, not in a hand-rolled box.
   *
   * The element is already banned (`tables`), so this catches the arrangement: a
   * `rounded`/`border` container wrapped around a `Table` is a second definition of what
   * a table card looks like, and it is how one table ends up with different padding from
   * the one above it. `TableCard` settles the arrangement once — including aligning the
   * outer columns with the card's own padding, which no route should have to restate.
   *
   * `Panel` is the other legitimate parent: a table inside a panel that also carries
   * prose or a figure is a panel, not a table card.
   */
  tableBox: {
    title: "hand-rolled table container",
    hint: "wrap the table in <TableCard> from components/mri/patterns.tsx instead of a bordered box",
    scan(rel, source) {
      const hits = [];
      const lines = source.split("\n");
      for (const match of source.matchAll(/<Table[\s>]/g)) {
        const line = lineOf(source, match.index);
        // The line directly above only. A wider window caught a segmented control that
        // happened to sit two lines over a table, which is not a container.
        for (let i = line - 2; i >= Math.max(0, line - 2); i--) {
          const classes = lines[i]?.match(/className="([^"]*)"/);
          if (!classes) {
            if (/<(TableCard|Panel)\b/.test(lines[i] ?? "")) break;
            continue;
          }
          if (/\brounded|\bborder\b/.test(classes[1])) {
            hits.push({ line: i + 1, token: classes[1].split(" ").find((c) => /^rounded|^border/.test(c)) ?? "bordered box" });
          }
          break;
        }
      }
      return hits;
    },
  },

  /**
   * A table header is plain. A shaded one is the most common drift in this system,
   * and it makes the same table look like two different components on two routes.
   *
   * Only the *header* treatment is checked mechanically. The container is checked by
   * banning the raw element (`tables`, above); a route that has a `Table` in its own
   * bordered box is caught by review, because no class-string signature distinguishes
   * that box from any other card.
   */
  tableHeaders: {
    title: "shaded table header",
    hint: "a table header carries no background, no blur and no shadow; move the emphasis into the data",
    scan(rel, source) {
      const hits = [];
      for (const match of source.matchAll(/<TableHeader\b[^>]*className=(?:"([^"]*)"|\{cn\(\s*"([^"]*)")/g)) {
        const classes = match[1] ?? match[2] ?? "";
        for (const util of classes.matchAll(/(?<![\w:-])((?:[a-z0-9]+:)*(?:bg|backdrop-blur|shadow)-[^\s"']+)/g)) {
          hits.push({ line: lineOf(source, match.index), token: util[1] });
        }
      }
      return hits;
    },
  },

  /**
   * A wide table drops columns on a phone.
   *
   * `TableCell` and `TableHead` ship `whitespace-nowrap`, so a table is as wide as the
   * sum of its longest cell in every column and never shrinks. `Table` does wrap itself
   * in `overflow-x-auto`, and this system previously treated that as sufficient —
   * "containment is horizontal, long rows stay reachable". Measured on a 390px phone it
   * was not sufficient at all:
   *
   *   /inaturalist country grid    8 columns   890px in a 423px box   +467px
   *   /inaturalist observers       7 columns   560px in a 393px box   +167px
   *   / country-first records      4 columns   476px in a 360px box   +116px
   *
   * and the first still overflowed at 768px. A reader does not discover five columns
   * behind a swipe they cannot see, so the rule is the one this system already states
   * in prose: **if a table displays too much information, drop some columns.**
   *
   * The check is deliberately about the *header block* rather than about total width,
   * because a class-string scan cannot measure rendered text. Four or more columns is
   * the threshold at which a phone-sized card has to lose one, and the requirement is
   * only that it lost *something* — which column is a judgement the audit cannot make.
   *
   * Both spellings are accepted: the shared `COLUMN.secondary` / `COLUMN.tertiary`
   * tokens, and the literal utility, because the generated `TableHead` cannot be
   * wrapped and a route is free to write the class directly.
   */
  tableColumns: {
    title: "wide table with no mobile column priority",
    hint: "a header row of four or more columns must drop some on a phone — mark them with COLUMN.secondary or COLUMN.tertiary from components/mri/patterns.tsx",
    scan(rel, source) {
      // A class string on the header row is enough: the matching body cells are not
      // required to carry it, because a `<td>` inside a `.map` renders one cell per
      // row and the header is the single place the column is declared.
      //
      // The test is per class string rather than across the whole block, because the
      // two halves of the idiom are frequently separated — `hidden text-right
      // sm:table-cell` is one column being dropped, and a block-wide "contains hidden,
      // contains a variant" test would also pass a table where one column is hidden by
      // an unrelated utility and no column is dropped at all.
      const dropsAColumn = (classes) =>
        /\bhidden\b/.test(classes) && /\b(?:sm|md|lg|xl):table-cell\b/.test(classes);
      const hits = [];
      for (const match of source.matchAll(/<TableHeader\b[\s\S]*?<\/TableHeader>/g)) {
        const block = match[0];
        const columns = (block.match(/<TableHead\b/g) ?? []).length;
        if (columns < 4) continue;
        const dropped =
          [...block.matchAll(/"([^"]*)"/g)].some((literal) => dropsAColumn(literal[1])) ||
          /COLUMN\.(?:secondary|tertiary)/.test(block);
        if (dropped) continue;
        hits.push({ line: lineOf(source, match.index), token: `${columns} columns, none dropped` });
      }
      return hits;
    },
  },

  /**
   * A table is not pinned to a minimum width.
   *
   * The counterpart to `tableColumns`, and the reason that rule alone was not enough.
   * Eight tables on the platform carried `min-w-[640px]` (or 540/600/620/700) on the
   * `<Table>` itself — an earlier answer to "this table is too wide on a phone", where
   * the fix was to force it wide and let the reader scroll. That directly defeats
   * hiding columns: measured at 390px, `/inaturalist`'s country grid was still 640px
   * inside a 360px card *after* four of its eight columns had been marked hidden,
   * because no amount of hiding can take a table below a floor it was given.
   *
   * Per-column `min-w-[140px]` is the same mistake in smaller pieces: five of them sum
   * to a 600px table without any one of them looking unreasonable.
   *
   * A **prefixed** minimum is legitimate and is not flagged: `sm:min-w-[440px]` only
   * applies from 640px, where a card genuinely has the room, and scoping it is the
   * correct way to say "this table wants 440px once it can have it".
   */
  tableMinWidth: {
    title: "table pinned wider than a phone",
    hint: "drop columns with COLUMN.secondary instead of pinning widths; if a table genuinely needs room, scope the minimum to a breakpoint (`sm:min-w-[440px]`)",
    scan(rel, source) {
      const hits = [];
      /**
       * What a card actually offers on the narrowest supported screen. The preset's
       * page gutter is 16px a side and a card adds its own padding, so a 390px phone
       * leaves roughly this much for a table. The platform declares `min-width: 320px`
       * on `html`; at that width the figure is nearer 290, which is why a table sitting
       * exactly on this line is still worth a look.
       */
      const PHONE = 360;
      /**
       * An unprefixed `min-w-[…]`. The lookbehind rejects `:` as well as word
       * characters, so `sm:min-w-[460px]` does not match at all — a scoped minimum is
       * legitimate and there is nothing left to test for afterwards.
       */
      const WIDTH = /(?<![\w:-])(min-w-\[(\d+(?:\.\d+)?)(px|rem)\])/g;
      /** A cell that hides itself below a breakpoint cannot pin anything on a phone. */
      const hidesBelow = (classes) =>
        /\bhidden\b/.test(classes) && /\b(?:sm|md|lg|xl):table-cell\b/.test(classes);
      const px = (value, unit) => (unit === "rem" ? Number(value) * 16 : Number(value));
      const classOf = (tag) => {
        const match = tag.match(/className=(?:"([^"]*)"|\{cn\(\s*"([^"]*)")/);
        return match ? (match[1] ?? match[2] ?? "") : "";
      };

      for (const table of source.matchAll(/<Table\b[\s\S]*?<\/Table>/g)) {
        const block = table[0];
        const openTag = block.slice(0, block.indexOf(">") + 1);

        // (a) A floor on the table itself can never be met on a phone, whatever the
        //     columns do — this is the case that made hiding columns look ineffective.
        for (const util of classOf(openTag).matchAll(WIDTH)) {
          hits.push({ line: lineOf(source, table.index), token: util[1] });
        }

        // (b) Otherwise, the widest single row is what the table cannot go below, so
        //     the floors are summed per row and the largest row is the one that counts.
        //     Summing the whole table would multiply by the row count; taking any one
        //     cell would miss five columns that are each reasonable alone.
        let widest = 0;
        let widestTokens = [];
        for (const row of block.matchAll(/<TableRow\b[\s\S]*?<\/TableRow>/g)) {
          let total = 0;
          const tokens = [];
          for (const cell of row[0].matchAll(/<(?:TableHead|TableCell)\b[^>]*>/g)) {
            const classes = classOf(cell[0]);
            if (hidesBelow(classes)) continue;
            for (const util of classes.matchAll(WIDTH)) {
              total += px(util[2], util[3]);
              tokens.push(util[1]);
            }
          }
          if (total > widest) {
            widest = total;
            widestTokens = tokens;
          }
        }
        if (widest > PHONE) {
          hits.push({
            line: lineOf(source, table.index),
            token: `${Math.round(widest)}px of column floors (${widestTokens.join(" + ")})`,
          });
        }
      }
      return hits;
    },
  },

  /**
   * A link is a link, not a button wearing a link.
   *
   * `Button` accepts `render={<Link/>}`, and Base UI then applies `role="button"` to
   * the anchor — unconditionally, since `useButton` emits `isNativeButton ? {type:
   * 'button'} : {role: 'button'}` and `isNativeButton` is the prop, not the rendered
   * element. The control still navigates, but it is announced as a button: it drops
   * out of a screen reader's link list, loses "open in new tab" from that list, and
   * promises a button's behaviour while performing a link's.
   *
   * This was the pattern the design system itself taught — sixteen call sites across
   * eight files, and zero uses of `buttonVariants`. The platform had independently
   * settled on the correct one in thirty-six places. For anything that navigates, put
   * `buttonVariants()` in the `className` of the `<Link>` or `<a>` and leave `Button`
   * to the controls that actually do something on the page.
   */
  buttonLink: {
    title: "navigation link rendered through Button",
    hint: "use className={buttonVariants({ variant, size })} on the <Link> instead; Base UI forces role=\"button\" on a non-<button> and the link stops being a link",
    scan(rel, source) {
      const hits = [];
      for (const match of source.matchAll(/<Button\b[\s\S]{0,400}?render=\{\s*<(Link|a)\b/g)) {
        hits.push({ line: lineOf(source, match.index), token: `render={<${match[1]}` });
      }
      return hits;
    },
  },

  /**
   * Type is on the scale, and the scale is short.
   *
   * The spacing rule has existed since the beginning and caught 120 off-scale
   * utilities. Type had no rule at all, and it drifted further than spacing ever did:
   * measured across the platform, **401 font sizes were written as px literals** —
   * 229 `text-[11px]`, 156 `text-[10px]`, and a tail of 7.5, 8.5, 9, 9.5, 10.5, 13 and
   * 15px. `text-[11px]` and `text-[0.6875rem]` are the same size written two ways, and
   * the platform contained both, so two cards side by side could hold the same size
   * spelled differently and nobody could tell whether the difference meant anything.
   *
   * The rule is deliberately narrow: it only judges `text-[…]` whose value is a bare
   * **length**. `text-[#1f6f4a]` and `text-[oklch(…)]` are colours and belong to the
   * `tokens` and `dataColours` rules; flagging them here would report one mistake
   * twice under two names.
   *
   * The three sanctioned arbitrary values are the ones the preset's own scale does not
   * name but this system genuinely needs, all in `rem` so they follow the root size:
   *
   *   text-[0.5625rem]   9px   mono token values inside a reference table
   *   text-[0.625rem]   10px   eyebrows, captions and mono meta
   *   text-[0.6875rem]  11px   the small tier of body copy
   *
   * Everything from 12px up has a name — `text-xs`, `text-sm`, `text-base`, `text-lg`
   * — and a route should use it. `rem` rather than `px` is the point even where the
   * value matches: a px literal does not follow a reader's font-size preference.
   */
  type: {
    title: "off-scale font size",
    hint: "use text-xs / text-sm / text-base / text-lg…, or one of text-[0.5625rem] (9px), text-[0.625rem] (10px), text-[0.6875rem] (11px)",
    scan(rel, source) {
      const SANCTIONED = new Set(["0.5625rem", "0.625rem", "0.6875rem"]);
      const hits = [];
      for (const { literal, line } of literals(source)) {
        for (const match of literal.matchAll(/(?<![\w:-])text-\[([^\]]+)\]/g)) {
          const value = match[1];
          if (!/^[\d.]+(?:px|rem|em)$/.test(value)) continue;
          if (SANCTIONED.has(value)) continue;
          hits.push({ line, token: `text-[${value}]` });
        }
      }
      return hits;
    },
  },

  /**
   * A card does not lift off the page on hover.
   *
   * `group-hover:-translate-y-0.5` was the platform's default card affordance — a
   * two-pixel rise with a shadow, copied onto every clickable card. It is motion that
   * carries no information, and because each route wrote its own it also carried a
   * different distance and duration each time.
   *
   * The system's own hover is a **colour change with no movement**: `hover:ring-primary/30`
   * on a card, `hover:text-foreground` on a link. Those hold a grid still while still
   * saying "this is interactive", and they do not re-run layout on every pointer move.
   *
   * Only translation is banned. `group-hover:scale-105` on an `<img>` inside a media
   * card is a different thing — it moves nothing and changes no layout — and it stays.
   */
  motion: {
    title: "hover translation on a surface",
    hint: "use a colour change that holds the grid still — hover:ring-primary/30, hover:text-foreground — rather than moving the element",
    scan(rel, source) {
      const hits = [];
      for (const { literal, line } of literals(source)) {
        for (const match of literal.matchAll(
          /(?<![\w-])(?:[a-z0-9]+:)*(?:-translate-[xy]|translate-[xy])-/g,
        )) {
          if (!/hover:/.test(match[0])) continue;
          hits.push({ line, token: match[0] });
        }
      }
      return hits;
    },
  },

  /**
   * A data card has no eyebrow.
   *
   * This is rule one of the data-card header and the only one that had no enforcement.
   * `Panel` carries it structurally — there is no `eyebrow` prop, and the docstring
   * says why: "the title already names the section, and an eyebrow both duplicates it
   * and breaks row alignment." But a route building its own `Card` can put an
   * `Eyebrow` above the title, and six cards in a row then have six different header
   * heights because two of the eyebrows wrap.
   *
   * The audit's `headers` rule cannot see this: it looks for `font-semibold` plus
   * `tracking-tight`, and `Eyebrow` is `font-medium uppercase tracking-[0.14em]`. A
   * different signature for the same mistake.
   *
   * The check is a **proximity** one, like `twoUp`: for each `<Eyebrow`, look up to
   * twenty lines back for a `<Card` or `<Panel` that has not been closed yet. That is
   * the closest a class-string audit gets to "these two are in the same box", and it is
   * a prompt to look rather than a proof — which is why the fix is usually to move the
   * label into the title's own detail line rather than to argue with the rule.
   */
  cardEyebrow: {
    title: "uppercase eyebrow inside a data card",
    hint: "a card header is the title plus one line of detail — fold the eyebrow's text into that line, or use <Panel>, which has no eyebrow by design",
    scan(rel, source) {
      const hits = [];
      const lines = source.split("\n");
      const OPENS = /<(Card|Panel)\b/;
      const CLOSES = /<\/(Card|Panel)>/;
      for (const match of source.matchAll(/<Eyebrow\b/g)) {
        const line = lineOf(source, match.index);
        for (let i = line - 2; i >= Math.max(0, line - 21); i--) {
          if (CLOSES.test(lines[i])) break;
          if (OPENS.test(lines[i])) {
            hits.push({ line, token: `${lines[i].match(OPENS)[1]} + Eyebrow` });
            break;
          }
        }
      }
      return hits;
    },
  },

  /**
   * A colour is a token, never a Tailwind palette name.
   *
   * The `tokens` rule above catches arbitrary values (`text-[#3b82f6]`), which is the
   * narrow case. The wide one is the named palette: `text-emerald-600` for "good",
   * `bg-amber-500` for "caution", `text-rose-600` for "bad". Those are not colours that
   * escaped the system, they are the system's semantic roles — `positive`, `warning`,
   * `destructive`, `info` — written out by hand, per page, in whichever of the eleven
   * shades the author happened to pick. `mri-theme.css` already says why the roles
   * exist: "without these three roles, routes invent them per page — which is exactly
   * how the platform ended up with amber-500/90 in one card, amber-500/15 in another,
   * and an olive chip standing in for warning in a third."
   *
   * Even `text-white` and `from-black` are covered: on a solid fill the ink is
   * `-foreground`, and a scrim over a photograph is `foreground/70`, which is what
   * `AudioPlayer`'s overlay surface uses. There is no colour this rule cannot express
   * as a token, so it carries no allow-list — an allow-list here would be the drift it
   * exists to stop, with a reason attached.
   */
  /**
   * A chart colour is opaque, or it is data.
   *
   * `--chart-1 … --chart-5` exist to encode magnitude and identity inside a figure.
   * Written as a **solid** utility they are doing exactly that: a legend swatch has to
   * match its series and a bar has to match its own fill, so `bg-chart-3` on an 8px
   * `<span>` is the legend working.
   *
   * Written as a **fraction** they are decoration. `border-chart-3/30 bg-chart-3/5` is
   * a wash over a whole card: the opacity says "this is a tint, not a colour", which is
   * the one thing a data colour may never be, because the tint then reads as a category
   * that no data put it in. `/birds` had six differently tinted workspace cards, one
   * per card, chosen by nothing, and three "streak" badges washed in `chart-2` — the
   * green of an area chart.
   *
   * A surface that signifies something uses a status role — `primary`, `info`,
   * `warning`, `notable`, `destructive` — each of which means a state rather than a
   * series. The split is mechanical: a solid chart utility passes, a fractional one
   * fails. That is what makes it checkable rather than a matter of taste.
   */
  chartTint: {
    title: "chart colour used as a surface tint",
    hint: "a chart colour fills a legend swatch or a bar solid; to signify a state on a surface use a status role (primary / info / warning / notable / destructive) or a Chip tone",
    scan(rel, source) {
      const hits = [];
      for (const { literal, line } of literals(source)) {
        for (const match of literal.matchAll(
          /(?<![\w-])(?:[a-z0-9]+:)*(?:bg|border|text|ring|from|via|to|fill|stroke|outline|decoration|shadow)-chart-\d\/\d+/g,
        )) {
          hits.push({ line, token: match[0] });
        }
      }
      return hits;
    },
  },

  palette: {
    title: "Tailwind palette colour",
    hint: "use a semantic token: positive -> primary-ink, warning -> warning-ink, negative -> destructive-ink, info -> info-ink; ink on a fill -> -foreground; scrims -> foreground/NN",
    scan(rel, source) {
      // The same documentation exemption as the other two colour rules: a page that
      // publishes the rules has to be able to name the classes it forbids, in prose
      // and in code samples.
      if (ALLOWED_COLOUR_FILES.has(rel)) return [];
      const hits = [];
      for (const { literal, line } of literals(source)) {
        for (const match of literal.matchAll(PALETTE_COLOUR)) {
          hits.push({ line, token: match[0] });
        }
      }
      return hits;
    },
  },

  /**
   * A colour is a token, never a value — **including inside a data object**.
   *
   * The `tokens` rule above reads class-name strings, so a hex sitting in a chart
   * palette (`{ start: "#3b82f6", end: "#1d4ed8" }`) was invisible to it. That was a
   * correct scoping decision for a token-conformance pass and the wrong one for a
   * design migration: it left seventy-one literals, the largest single block of
   * styling on the platform that no token governed, looking compliant. Charts get
   * their colours from `CHART_COLORS` and `CATEGORICAL` in `lib/chart-colors.ts`.
   */
  dataColours: {
    title: "colour literal outside a class name",
    hint: "chart colour comes from CHART_COLORS / CATEGORICAL in lib/chart-colors.ts, or from a --chart-* token",
    scan(rel, source) {
      if (ALLOWED_COLOUR_FILES.has(rel)) return [];
      const hits = [];
      for (const { literal, line } of literals(source)) {
        // A mask is an alpha channel, not a colour. `[mask-image:radial-gradient(…,
        // rgba(0,0,0,0.72) …)]` names black because black is "opaque" there, and the
        // hue is discarded by the mask — so it is not a colour decision, and rewriting
        // it as a token would only make it a less obvious way of saying the same thing.
        if (/\[mask(-image)?:/.test(literal)) continue;
        for (const match of literal.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\boklch\(/g)) {
          hits.push({ line, token: match[0] });
        }
      }
      return hits;
    },
  },

  /**
   * At most two data surfaces in a row.
   *
   * The check is a **proximity** one: for each table or chart, look at the ten lines
   * above it for a three-or-more column grid, stopping early at a closing tag that
   * ends the enclosing element. That is what a wrapper looks like, and it is the
   * closest a class-string audit gets to "these two blocks are siblings" without an
   * AST.
   *
   * It is a prompt to look rather than a proof, and the honest fix is structural:
   * `DataRow` is a component, and a component can be held to two columns in a way a
   * convention cannot.
   */
  twoUp: {
    title: "three-or-more column grid around a data surface",
    hint: "arrange tables and charts with <DataRow>, which caps a row at two; a wider grid is for cards and specimens",
    scan(rel, source) {
      const hits = [];
      const lines = source.split("\n");
      const CLOSES = /^\s*<\/(div|section|main|article)>\s*$/;
      for (const match of source.matchAll(/<(TableCard|ChartFrame|Table)\b/g)) {
        const line = lineOf(source, match.index);
        for (let i = line - 2; i >= Math.max(0, line - 11); i--) {
          const grid = lines[i].match(/(?<![\w:-])((?:[a-z0-9]+:)*grid-cols-([3-9]|\d{2,}))/);
          if (grid) {
            hits.push({ line: i + 1, token: grid[1] });
            break;
          }
          if (CLOSES.test(lines[i])) break;
        }
      }
      return hits;
    },
  },

  /**
   * A card is not nested inside a card.
   *
   * It is the most common structural drift in this system and the hardest to see in a
   * diff, because each card is correct on its own. What it produces is a box inside a
   * box inside a box: the inner card's ring sits 12px inside the outer one's, the radii
   * disagree, and the padding doubles. The platform shipped a "This is the highest
   * ranked row" note as a full `Panel` inside another `Panel`, a metric card inside a
   * filter card, and — worst — a whole page's content inside one `Card` whose only
   * child was another `Card`.
   *
   * The fix is almost never "remove the outer card". It is to ask what the outer card
   * is for: if it groups, it is a `SectionHeader` and a plain `div`; if it is one
   * figure, the inner thing was not a card at all.
   *
   * This walks the file tracking depth rather than looking at a line window, because
   * the two openings can be a hundred lines apart and a window would either miss them
   * or fire on unrelated markup. `TableCard` and `ChartFrame` both render a `Panel`
   * inside themselves, so a route that puts either of those inside a card has done the
   * same thing and is counted the same way. A self-closing tag opens nothing.
   */
  cardInCard: {
    title: "card nested inside a card",
    hint: "a card groups nothing but its own content — if the outer box groups, use SectionHeader and a plain div; if it is one figure, the inner thing was not a card",
    scan(rel, rawSource) {
      const source = stripComments(rawSource);
      const CARDS = ["Card", "Panel", "TableCard", "ChartFrame"];
      const opens = new RegExp(`<(${CARDS.join("|")})\\b`, "g");
      const closes = new RegExp(`</(${CARDS.join("|")})>`, "g");
      const events = [];
      for (const m of source.matchAll(opens)) {
        // `<Card />` opens nothing. Find the end of this tag to tell.
        const end = source.indexOf(">", m.index);
        const selfClosing = end !== -1 && source[end - 1] === "/";
        events.push({ index: m.index, kind: selfClosing ? "self" : "open", name: m[1] });
      }
      for (const m of source.matchAll(closes)) {
        events.push({ index: m.index, kind: "close", name: m[1] });
      }
      events.sort((a, b) => a.index - b.index);

      const hits = [];
      const stack = [];
      for (const event of events) {
        if (event.kind === "self") continue;
        if (event.kind === "open") {
          if (stack.length > 0) {
            hits.push({
              line: lineOf(source, event.index),
              token: `<${event.name}> inside <${stack[stack.length - 1].name}>`,
            });
          }
          stack.push(event);
        } else {
          // Pop the nearest matching opener, so one unbalanced card does not cascade.
          const at = stack.map((s) => s.name).lastIndexOf(event.name);
          if (at === -1) continue;
          stack.length = at;
        }
      }
      return hits;
    },
  },

  /**
   * The page owns the `h1`, and there is exactly one of it.
   *
   * A component that renders an `h1` claims to be a page. `species-explorer.tsx` — a
   * client component rendered by two different routes — emitted the platform's top-level
   * heading, so the document outline had an `h1` whose text came from a prop, and adding
   * a second route that used it would have produced two. The heading a page owns is
   * `PageHeader`'s; a component that needs a heading uses `h2` or below.
   *
   * A second `h1` in the same file is the other half: a page with two top-level headings
   * has no top-level heading.
   */
  singleH1: {
    title: "h1 outside the page header",
    hint: "the page's h1 comes from PageHeader; a component uses h2 or below, and a file has at most one h1",
    scan(rel, rawSource) {
      const source = stripComments(rawSource);
      const hits = [];
      const found = [...source.matchAll(/<h1[\s>]/g)].map((m) => m.index);
      if (found.length === 0) return hits;
      const inComponents = rel.startsWith("components/") && !rel.startsWith("components/mri/");
      for (const index of found) {
        if (inComponents) {
          hits.push({ line: lineOf(source, index), token: "<h1> in a component" });
        } else if (found.length > 1 && index !== found[0]) {
          hits.push({ line: lineOf(source, index), token: "second <h1>" });
        }
      }
      return hits;
    },
  },

  /**
   * A route does not build its own page shell.
   *
   * The `padding` rule below catches a route that passes `py-*` to `PageContainer`.
   * This catches the other half of the same mistake: a route that never uses
   * `PageContainer` at all and instead writes the shell itself. The platform's five
   * document routes shared a hand-written `LegalPage` doing exactly that —
   * `mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-10 lg:px-8` — so the page gutter
   * was defined twice, and a change to `PageContainer` would have moved four routes
   * and left five behind.
   *
   * The signature is the combination, not any one utility: a centred, width-capped,
   * gutter-and-rhythm container. Card padding (`px-4 py-3`) and a prose measure
   * (`mx-auto max-w-sm`) are neither of those things and are not flagged.
   *
   * `components/shell/` is outside `PageContainer` by construction — the header and
   * footer are the frame the container sits inside — so those files own a gutter
   * legitimately and are named in `pageShellAllowed` with their reason.
   */
  pageShell: {
    title: "route-level page shell",
    hint: "let PageContainer own the gutter, the rhythm and the width; a route lists its sections as children",
    scan(rel, source) {
      if (PAGE_SHELL_ALLOWED.has(rel)) return [];
      const hits = [];
      for (const { literal, line } of literals(source)) {
        if (!/mx-auto/.test(literal)) continue;
        if (!/\bmax-w-/.test(literal)) continue;
        if (!/(?<![\w-])px-(?:4|6|8)\b/.test(literal)) continue;
        if (!/(?<![\w-])py-(?:6|10)\b/.test(literal)) continue;
        hits.push({ line, token: "mx-auto + max-w + page gutter and rhythm" });
      }
      return hits;
    },
  },

  /**
   * `PageContainer` owns page padding, so a route must not restate it.
   *
   * The contract exists because padding used to be inherited: nothing supplied a
   * top padding at all, routes passed whatever `pb` they felt like, and twenty-four
   * files ended up with seven different recipes between them. Only the *page rhythm*
   * utilities are banned — horizontal gutters and layout utilities like `flex` are
   * legitimate, which is why this is narrower than "no className".
   */
  padding: {
    title: "page padding restated around PageContainer",
    hint: "PageContainer decides page padding; drop py/pt/pb/space-y from it and from any wrapper directly around it",
    scan(rel, source) {
      const RHYTHM = /(?<![\w:-])((?:[a-z0-9]+:)*(?:py|pt|pb|space-y)-[\d.]+)/g;
      const hits = [];

      // On the container itself.
      const pattern = /<PageContainer\b[^>]*?className=(?:"([^"]*)"|\{"([^"]*)"|\{cn\(\s*"([^"]*)")/g;
      for (const match of source.matchAll(pattern)) {
        const classes = match[1] ?? match[2] ?? match[3] ?? "";
        for (const util of classes.matchAll(RHYTHM)) {
          hits.push({ line: lineOf(source, match.index), token: util[1] });
        }
      }

      // On the element immediately wrapping it. This is the half that was missed:
      // the container was cleaned up and eleven files kept their rhythm by wrapping
      // it in `<div className="pb-10 pt-3">`, which the rule could not see because it
      // only ever read the container's own attributes. The wrapper is not a loophole
      // in the contract; it is the same violation one level out.
      const lines = source.split("\n");
      for (const match of source.matchAll(/<PageContainer\b/g)) {
        const line = lineOf(source, match.index);
        for (let i = line - 2; i >= Math.max(0, line - 3); i--) {
          const classes = lines[i].match(/className="([^"]*)"/);
          if (!classes) continue;
          for (const util of classes[1].matchAll(RHYTHM)) {
            hits.push({ line: i + 1, token: `${util[1]} (wrapper)` });
          }
          break;
        }
      }
      return hits;
    },
  },
};

const CSS_RULE = {
  title: "unsanctioned stylesheet",
  hint: "there is no second way to add CSS; see docs/mri-ui-rules.md",
};

/**
 * The generated layer is exempt from every rule **except this one**.
 *
 * `components/ui` is regenerated by the shadcn CLI and `components/mri` is installed
 * from a registry, so auditing either for house style would report upstream's
 * decisions as local drift and would fight every reinstall. That exemption is right
 * for spacing and wrong for this: the preset emits `@phosphor-icons/react`
 * unqualified on any component carrying an icon, and that entry calls
 * `createContext`, so importing it breaks every Server Component that renders the
 * component. `checkbox` shipped it twice, and `sheet` and `sidebar` each shipped it
 * once — always silently, because the file is regenerated rather than reviewed.
 *
 * It is one comparison, it cannot be caught by reading a diff, and it takes the app
 * down rather than merely looking wrong, so it is worth the exception.
 */
const PHOSPHOR_RULE = {
  title: "bare Phosphor import in generated code",
  hint: "icons must come from @phosphor-icons/react/dist/ssr; the bare entry calls createContext and breaks Server Components",
};

/* --------------------------------------------------------------------- run */

function scanSource() {
  const hits = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      if (!/\.(tsx|ts)$/.test(file)) continue;
      const rel = relative(ROOT, file);
      if (isGenerated(rel)) continue;
      const source = readFileSync(file, "utf8");
      for (const [id, rule] of Object.entries(RULES)) {
        for (const hit of rule.scan(rel, source)) hits.push({ rule: id, file: rel, ...hit });
      }
    }
  }
  return hits;
}

function scanStylesheets() {
  const hits = [];
  for (const file of walk(ROOT)) {
    if (!file.endsWith(".css")) continue;
    const rel = relative(ROOT, file);
    if (ALLOWED_CSS.has(rel)) continue;
    hits.push({ rule: "css", file: rel, line: 1, token: rel });
  }
  return hits;
}

/** The one rule that reaches into the generated layer. See `PHOSPHOR_RULE`. */
function scanGeneratedPhosphor() {
  const hits = [];
  for (const prefix of GENERATED) {
    for (const file of walk(join(ROOT, prefix))) {
      if (!/\.(tsx|ts)$/.test(file)) continue;
      const rel = relative(ROOT, file);
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(IMPORT_SOURCE)) {
        const spec = match[1];
        if (spec !== "@phosphor-icons/react") continue;
        if (isTypeOnlyImport(source, match.index)) continue;
        hits.push({ rule: "phosphor", file: rel, line: lineOf(source, match.index), token: spec });
      }
    }
  }
  return hits;
}

/** Every rule, keyed, for the report and the failure formatter. */
const ALL_RULES = { ...RULES, css: CSS_RULE, phosphor: PHOSPHOR_RULE };

const sortHits = (hits) =>
  hits.sort(
    (a, b) => a.rule.localeCompare(b.rule) || a.file.localeCompare(b.file) || a.token.localeCompare(b.token) || a.line - b.line,
  );

/** One ledger entry per distinct (rule, file, token); the count catches additions. */
function toLedger(hits) {
  const entries = {};
  for (const hit of hits) {
    const key = `${hit.rule}|${hit.file}|${hit.token}`;
    entries[key] = (entries[key] ?? 0) + 1;
  }
  return entries;
}

function loadBaseline() {
  if (!existsSync(BASELINE)) return {};
  return JSON.parse(readFileSync(BASELINE, "utf8")).entries ?? {};
}

const args = new Set(argv);
const hits = sortHits([...scanSource(), ...scanStylesheets(), ...scanGeneratedPhosphor()]);
const measured = toLedger(hits);

if (args.has("--report")) {
  const byRule = new Map();
  for (const hit of hits) {
    if (!byRule.has(hit.rule)) byRule.set(hit.rule, []);
    byRule.get(hit.rule).push(hit);
  }
  console.log(`MRI UI audit — ${hits.length} violations\n`);
  for (const [id, rule] of Object.entries(ALL_RULES)) {
    const list = byRule.get(id) ?? [];
    const files = new Set(list.map((h) => h.file)).size;
    console.log(`  ${id.padEnd(8)} ${String(list.length).padStart(4)}  in ${String(files).padStart(3)} files   ${rule.title}`);
  }
  console.log(`\nBaseline holds ${Object.values(loadBaseline()).reduce((a, b) => a + b, 0)} entries.`);
  process.exit(0);
}

if (args.has("--update-baseline")) {
  const hadBaseline = existsSync(BASELINE);
  const previous = loadBaseline();
  const before = Object.values(previous).reduce((a, b) => a + b, 0);
  const after = Object.values(measured).reduce((a, b) => a + b, 0);

  // The guard protects an existing ledger from quiet growth. Creating one for
  // the first time is not growth.
  if (hadBaseline && after > before && !args.has("--force")) {
    console.error(
      `✗ refusing to grow the baseline: ${before} → ${after}.\n` +
        `  The ledger may only shrink. Fix the new violations, or re-run with\n` +
        `  --update-baseline --force and say why in the commit message.`,
    );
    process.exit(1);
  }

  const sorted = Object.fromEntries(Object.entries(measured).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(
    BASELINE,
    JSON.stringify(
      {
        $comment:
          "Existing UI drift, frozen so new drift cannot ship. This ledger may only shrink: " +
          "audit-ui.mjs fails on any violation not listed here AND on any entry that no longer " +
          "occurs, so a rewritten file must delete its own entries. See docs/mri-ui-rules.md.",
        version: 1,
        entries: sorted,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`✓ baseline updated: ${before} → ${after} entries`);
  process.exit(0);
}

const baseline = loadBaseline();

// Count per (rule, file, token) so the ledger's allowance is compared as a
// number: a key already in the ledger may not simply gain more of the same.
const byKey = new Map();
for (const hit of hits) {
  const key = `${hit.rule}|${hit.file}|${hit.token}`;
  if (!byKey.has(key)) byKey.set(key, []);
  byKey.get(key).push(hit);
}

// New violations: anything beyond what the ledger allows for that key.
const fresh = [];
for (const [key, list] of byKey) {
  const allowed = baseline[key] ?? 0;
  if (list.length > allowed) fresh.push(...list.slice(allowed));
}

// Stale entries: the ledger promises drift that is no longer there.
const seen = measured;
const stale = Object.entries(baseline).filter(([key, count]) => (seen[key] ?? 0) < count);

if (fresh.length === 0 && stale.length === 0) {
  const total = Object.values(baseline).reduce((a, b) => a + b, 0);
  console.log(`✓ UI audit passed — no new drift; ${total} baselined violations still to pay down.`);
  process.exit(0);
}

if (fresh.length > 0) {
  console.error(`✗ ${fresh.length} new UI violation${fresh.length === 1 ? "" : "s"}:\n`);
  const byRule = new Map();
  for (const hit of fresh) {
    if (!byRule.has(hit.rule)) byRule.set(hit.rule, []);
    byRule.get(hit.rule).push(hit);
  }
  for (const [id, list] of byRule) {
    const rule = ALL_RULES[id];
    console.error(`  ${rule.title} — ${rule.hint}`);
    for (const hit of list.slice(0, 12)) {
      const key = `${hit.rule}|${hit.file}|${hit.token}`;
      const allowed = baseline[key] ?? 0;
      const found = (byKey.get(key) ?? []).length;
      const note = allowed > 0 ? `   (ledger allows ${allowed}, found ${found})` : "";
      console.error(`    ${hit.file}:${hit.line}  ${hit.token}${note}`);
    }
    if (list.length > 12) console.error(`    … and ${list.length - 12} more`);
    console.error("");
  }
}

if (stale.length > 0) {
  console.error(`✗ ${stale.length} stale baseline entr${stale.length === 1 ? "y" : "ies"} — this drift is gone:\n`);
  for (const [key, count] of stale.slice(0, 12)) console.error(`    ${key}  (ledger says ${count})`);
  if (stale.length > 12) console.error(`    … and ${stale.length - 12} more`);
  console.error(
    `\n  Good news: the ledger may only shrink. Run\n` +
      `      npm run audit:ui -- --update-baseline\n` +
      `  to record the paydown.\n`,
  );
}

if (fresh.length > 0) {
  console.error(`  Fix these, or if the rule is genuinely wrong, change the rule — not the ledger.`);
}

process.exit(1);
