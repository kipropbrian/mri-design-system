#!/usr/bin/env node
/**
 * MRI parity check — is every installed design-system file the pinned version?
 *
 * "Byte-identical to the design system" was a habit, checked by hand with a `diff`
 * loop. A habit is what drifts: `layout.tsx` once shipped a review-only component to
 * every consumer, and `patterns` twice overwrote a corrected `checkbox`, and each was
 * found by someone remembering to look. This makes it a gate.
 *
 * The pin lives in `mri.json` at the project root:
 *
 *   { "designSystem": { "repo": "kipropbrian/mri-design-system", "ref": "<tag or sha>" } }
 *
 * For every registry item at that ref, each file whose target exists in this project is
 * compared byte for byte. Items the project never installed are skipped, so a project
 * only answers for what it uses. An installed file that differs fails the check: either
 * reinstall it at the pinned ref, or change it upstream and move the pin.
 *
 *   node scripts/check-mri-parity.mjs                  fetch the pinned ref from GitHub
 *   node scripts/check-mri-parity.mjs --source <dir>   compare against a local checkout
 *
 * A private repository needs `GH_TOKEN` (or `GITHUB_TOKEN`) in the environment.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const flag = (name) => {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
};

const ROOT = resolve(flag("--root") ?? process.cwd());
const SOURCE = flag("--source");

const pinFile = join(ROOT, "mri.json");
if (!existsSync(pinFile)) {
  console.error("✗ No mri.json: pin the design system with { designSystem: { repo, ref } }.");
  process.exit(1);
}
const { designSystem } = JSON.parse(readFileSync(pinFile, "utf8"));
if (!designSystem?.repo || !designSystem?.ref) {
  console.error("✗ mri.json must set designSystem.repo and designSystem.ref.");
  process.exit(1);
}

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

async function upstream(path) {
  if (SOURCE) {
    const file = join(resolve(SOURCE), path);
    return existsSync(file) ? readFileSync(file) : null;
  }
  const url = `https://raw.githubusercontent.com/${designSystem.repo}/${designSystem.ref}/${path}`;
  // Anonymous first: a public repository needs no token, and a token scoped to some
  // other repository (CI's GITHUB_TOKEN is the consumer's) can turn a 200 into a 404.
  // Only a private repository reaches the authenticated retry.
  let response = await fetch(url);
  if (response.status === 404 && token) {
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

const registryBytes = await upstream("registry.json");
if (!registryBytes) {
  console.error(`✗ registry.json not found at ${designSystem.repo}@${designSystem.ref}${SOURCE ? ` (${SOURCE})` : ""}.`);
  process.exit(1);
}
const registry = JSON.parse(registryBytes.toString("utf8"));

// A file can belong to more than one item (spacing-audit aliases ui-audit), so
// compare each target once.
const targets = new Map();
for (const item of registry.items) {
  for (const file of item.files ?? []) {
    if (!file.target?.startsWith("~/")) continue;
    targets.set(file.target.slice(2), { path: file.path, item: item.name });
  }
}

let checked = 0;
const drifted = [];
for (const [target, { path, item }] of targets) {
  const local = join(ROOT, target);
  if (!existsSync(local)) continue;
  const expected = await upstream(path);
  if (!expected) {
    drifted.push(`${target} (${item}): not in the design system at this ref`);
    continue;
  }
  checked += 1;
  if (!readFileSync(local).equals(expected)) drifted.push(`${target} (${item})`);
}

const where = `${designSystem.repo}@${designSystem.ref}`;
if (drifted.length) {
  console.error(`✗ ${drifted.length} installed file(s) differ from ${where}:`);
  for (const line of drifted) console.error(`    ${line}`);
  console.error("\n  Reinstall at the pinned ref (npx shadcn@latest add '<repo>/<item>#<ref>'),");
  console.error("  or make the change in the design system and move the pin in mri.json.");
  process.exit(1);
}
console.log(`✓ ${checked} installed file(s) match ${where}.`);
