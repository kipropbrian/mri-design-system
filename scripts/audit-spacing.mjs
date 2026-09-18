/**
 * Enforces the spacing scale.
 *
 * The template declares eight steps and allows nothing else, because "any
 * Tailwind value" is how 120 off-scale utilities, four card gutters and 28 chip
 * variants happened. This script extracts every class-list literal in the source
 * and fails on anything outside the scale, so the rule can be checked in CI
 * rather than trusted.
 *
 * It scans string literals rather than raw lines on purpose: prose may mention
 * `gap-2.5` when explaining why it is banned, and documentation should not have
 * to lie to satisfy its own linter.
 *
 *   node scripts/audit-spacing.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN = ["app", "components/shell"];
const SCALE = new Set(["0", "0.5", "1", "1.5", "2", "3", "4", "6", "10"]);

/** `gap-3`, `py-2.5`, `space-y-4` … captured from inside a class-list literal. */
const UTILITY = /(?<![\w-])(gap|p|px|py|pt|pr|pb|pl|space-x|space-y)-(\d+(?:\.\d+)?)(?![\d.])/g;

/** Matches "…" and `…` literals, including escaped quotes. */
const LITERALS = /"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;

/**
 * Control geometry, not layout rhythm. These belong to a fixed control
 * dimension — an input clearing a 14px icon, a sheet making room for its close
 * button, the desktop page gutter. Each is listed with its reason; if an entry
 * stops being true, delete it.
 */
const ALLOWED = new Map([
  ["pl-7", "search input: 14px icon plus its 8px inset"],
  ["pl-8", "search input at the larger control size"],
  ["px-8", "page shell gutter at lg (32px), matching the live platform"],
  ["pr-14", "sheet header clearance for the close button"],
]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (full.endsWith(".tsx") || full.endsWith(".ts")) yield full;
  }
}

const offences = [];
for (const dir of SCAN) {
  for (const file of walk(join(ROOT, dir))) {
    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(LITERALS)) {
      const literal = match[1] ?? match[2];
      if (!literal) continue;
      const line = source.slice(0, match.index).split("\n").length;
      for (const util of literal.matchAll(UTILITY)) {
        const token = `${util[1]}-${util[2]}`;
        if (SCALE.has(util[2])) continue;
        if (ALLOWED.has(token)) continue;
        offences.push({ file: relative(ROOT, file), line, token });
      }
    }
  }
}

if (offences.length === 0) {
  console.log(`✓ All spacing utilities are on the scale (${[...SCALE].join(" / ")}).`);
  process.exit(0);
}

const byToken = new Map();
for (const o of offences) byToken.set(o.token, (byToken.get(o.token) ?? 0) + 1);
console.error(`✗ ${offences.length} spacing utilities are off scale:`);
for (const [token, count] of [...byToken].sort((a, b) => b[1] - a[1])) {
  console.error(`    ${token.padEnd(10)} ${count}`);
}
console.error(`\nAllowed scale: ${[...SCALE].join(" / ")}`);
for (const o of offences.slice(0, 25)) {
  console.error(`    ${o.file}:${o.line}  ${o.token}`);
}
process.exit(1);
