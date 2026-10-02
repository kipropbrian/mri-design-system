/**
 * Tests for the UI audit's ratchet.
 *
 * The audit is the gate the whole rewrite leans on, so its two failure modes
 * are tested end to end rather than trusted: a new violation must fail, and a
 * baseline entry that no longer occurs must also fail. If the second ever
 * stops working the ledger becomes a graveyard and the gate is theatre.
 *
 *   node --test scripts/audit-ui.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const AUDIT = new URL("audit-ui.mjs", import.meta.url).pathname;

/** A throwaway tree shaped like the platform, so the audit's paths resolve. */
function fixture(files, baseline) {
  const root = mkdtempSync(join(tmpdir(), "mri-audit-"));
  mkdirSync(join(root, "app"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "app", name), body);
  }
  if (baseline) {
    writeFileSync(join(root, "scripts", "audit-baseline.json"), JSON.stringify({ version: 1, entries: baseline }));
  }
  return root;
}

function run(root, ...flags) {
  const result = spawnSync(process.execPath, [AUDIT, "--root", root, ...flags], { encoding: "utf8" });
  return { code: result.status, out: `${result.stdout}${result.stderr}` };
}

const withCleanup = (root, fn) => {
  try {
    return fn();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const CLEAN = `export const A = () => <div className="flex gap-3 px-4 py-3" />;\n`;

test("passes on a clean tree with no baseline", () => {
  const root = fixture({ "page.tsx": CLEAN });
  withCleanup(root, () => {
    const { code, out } = run(root);
    assert.equal(code, 0, out);
  });
});

test("fails on off-scale spacing", () => {
  const root = fixture({ "page.tsx": `export const A = () => <div className="gap-2.5" />;\n` });
  withCleanup(root, () => {
    const { code, out } = run(root);
    assert.equal(code, 1);
    assert.match(out, /gap-2\.5/);
    assert.match(out, /off-scale spacing/);
  });
});

test("fails on a hand-rolled chip", () => {
  const root = fixture({
    "page.tsx": `export const A = () => <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs" />;\n`,
  });
  withCleanup(root, () => {
    const { code, out } = run(root);
    assert.equal(code, 1);
    assert.match(out, /hand-rolled chip/);
  });
});

test("fails on a hand-rolled choice-strip item", () => {
  const root = fixture({
    "page.tsx": `export const A = () => <a className="rounded-md bg-primary px-2 py-1 text-primary-foreground" />;\n`,
  });
  withCleanup(root, () => {
    const { code, out } = run(root);
    assert.equal(code, 1);
    assert.match(out, /hand-rolled choice-strip item/);
    assert.match(out, /choice-strip-shaped class string/);
  });
});

test("allows ChoiceLink and does not confuse py-1.5 with py-1", () => {
  const root = fixture({
    "page.tsx": `export const A = () => <><ChoiceLink active href="/">Current</ChoiceLink><a className="rounded-md bg-primary px-2 py-1.5" /></>;\n`,
  });
  withCleanup(root, () => {
    const { code, out } = run(root);
    assert.equal(code, 0, out);
  });
});

test("fails on a raw table but allows the shared composition", () => {
  const raw = fixture({ "page.tsx": `export const A = () => <table><tbody /></table>;\n` });
  withCleanup(raw, () => {
    assert.equal(run(raw).code, 1);
  });

  const shared = fixture({ "page.tsx": `export const A = () => <table><tbody /></table>;\n` });
  mkdirSync(join(shared, "components", "ui"), { recursive: true });
  // The composition lives outside `app`, so this asserts the rule's path gate.
  withCleanup(shared, () => {
    assert.equal(run(shared).code, 1, "a table anywhere outside components/ui/table.tsx fails");
  });
});

test("fails on an arbitrary colour utility but allows a semantic token", () => {
  const bad = fixture({ "page.tsx": `export const A = () => <div className="bg-[#f8f6f1]" />;\n` });
  withCleanup(bad, () => {
    assert.equal(run(bad).code, 1);
  });

  const good = fixture({ "page.tsx": `export const A = () => <div className="bg-background text-primary" />;\n` });
  withCleanup(good, () => {
    assert.equal(run(good).code, 0);
  });
});

test("fails on a non-SSR phosphor import and allows the SSR entry", () => {
  const bad = fixture({ "page.tsx": `import { Tree } from "@phosphor-icons/react";\nexport const A = () => <Tree />;\n` });
  withCleanup(bad, () => {
    const { code, out } = run(bad);
    assert.equal(code, 1);
    assert.match(out, /banned import/);
  });

  const good = fixture({
    "page.tsx": `import { Tree } from "@phosphor-icons/react/dist/ssr";\nexport const A = () => <Tree />;\n`,
  });
  withCleanup(good, () => {
    assert.equal(run(good).code, 0);
  });
});

/* --------------------------------------------------------------- the ratchet */

test("a baselined violation passes and is reported as debt", () => {
  const root = fixture(
    { "page.tsx": `export const A = () => <div className="gap-2.5" />;\n` },
    { "spacing|app/page.tsx|gap-2.5": 1 },
  );
  withCleanup(root, () => {
    const { code, out } = run(root);
    assert.equal(code, 0, out);
    assert.match(out, /1 baselined violation/);
  });
});

test("a violation beyond the baselined count fails", () => {
  // The ledger allows one `gap-2.5` in this file; the tree has two.
  const root = fixture(
    { "page.tsx": `export const A = () => <><div className="gap-2.5" /><div className="gap-2.5" /></>;\n` },
    { "spacing|app/page.tsx|gap-2.5": 1 },
  );
  withCleanup(root, () => {
    assert.equal(run(root).code, 1);
  });
});

test("an unrelated new violation fails even when the file is already in the ledger", () => {
  const root = fixture(
    { "page.tsx": `export const A = () => <div className="gap-2.5 py-2.5" />;\n` },
    { "spacing|app/page.tsx|gap-2.5": 1 },
  );
  withCleanup(root, () => {
    const { code, out } = run(root);
    assert.equal(code, 1);
    assert.match(out, /py-2\.5/);
  });
});

test("a stale baseline entry fails, so the ledger can only shrink", () => {
  const root = fixture(
    { "page.tsx": CLEAN },
    { "spacing|app/page.tsx|gap-2.5": 1 },
  );
  withCleanup(root, () => {
    const { code, out } = run(root);
    assert.equal(code, 1);
    assert.match(out, /stale baseline entr/);
  });
});

test("--update-baseline shrinks the ledger and the tree then passes", () => {
  const root = fixture({ "page.tsx": CLEAN }, { "spacing|app/page.tsx|gap-2.5": 1 });
  withCleanup(root, () => {
    assert.equal(run(root, "--update-baseline").code, 0);
    const entries = JSON.parse(readFileSync(join(root, "scripts", "audit-baseline.json"), "utf8")).entries;
    assert.deepEqual(entries, {});
    assert.equal(run(root).code, 0);
  });
});

test("--update-baseline refuses to grow an existing ledger", () => {
  const root = fixture(
    { "page.tsx": `export const A = () => <div className="gap-2.5 py-2.5" />;\n` },
    { "spacing|app/page.tsx|gap-2.5": 1 },
  );
  withCleanup(root, () => {
    const refused = run(root, "--update-baseline");
    assert.equal(refused.code, 1);
    assert.match(refused.out, /refusing to grow the baseline/);

    // ...and --force is the documented escape hatch.
    assert.equal(run(root, "--update-baseline", "--force").code, 0);
  });
});

test("--report always exits 0, even on a dirty tree", () => {
  const root = fixture({ "page.tsx": `export const A = () => <div className="gap-2.5" />;\n` });
  withCleanup(root, () => {
    const { code, out } = run(root, "--report");
    assert.equal(code, 0);
    assert.match(out, /off-scale spacing/);
  });
});

test("fails on a table that drops no columns, allows one that does", () => {
  const wide = fixture({
    "page.tsx": `export const A = () => (
      <TableCard>
        <Table><TableHeader><TableRow>
          <TableHead>Country</TableHead><TableHead>Records</TableHead>
          <TableHead>Species</TableHead><TableHead>Share</TableHead>
        </TableRow></TableHeader></Table>
      </TableCard>
    );\n`,
  });
  withCleanup(wide, () => {
    const { code, out } = run(wide);
    assert.equal(code, 1);
    assert.match(out, /wide table with no mobile column priority/);
  });

  // Three columns is under the threshold: a narrow table has nothing to drop.
  const narrow = fixture({
    "page.tsx": `export const A = () => (
      <TableCard>
        <Table><TableHeader><TableRow>
          <TableHead>Country</TableHead><TableHead>Records</TableHead>
          <TableHead>Species</TableHead>
        </TableRow></TableHeader></Table>
      </TableCard>
    );\n`,
  });
  withCleanup(narrow, () => {
    assert.equal(run(narrow).code, 0);
  });

  // Four columns with one marked secondary passes, in both spellings.
  for (const marker of ['className={COLUMN.secondary}', 'className="hidden sm:table-cell"']) {
    const dropped = fixture({
      "page.tsx": `export const A = () => (
        <TableCard>
          <Table><TableHeader><TableRow>
            <TableHead>Country</TableHead><TableHead>Records</TableHead>
            <TableHead>Species</TableHead><TableHead ${marker}>Share</TableHead>
          </TableRow></TableHeader></Table>
        </TableCard>
      );\n`,
    });
    withCleanup(dropped, () => {
      assert.equal(run(dropped).code, 0, `should accept ${marker}`);
    });
  }
});

test("fails on a table pinned wider than a phone, allows a scoped minimum", () => {
  const pinned = fixture({
    "page.tsx": `export const A = () => (
      <TableCard>
        <Table className="min-w-[640px]"><TableHeader><TableRow>
          <TableHead>Country</TableHead><TableHead>Records</TableHead>
        </TableRow></TableHeader></Table>
      </TableCard>
    );\n`,
  });
  withCleanup(pinned, () => {
    const { code, out } = run(pinned);
    assert.equal(code, 1);
    assert.match(out, /table pinned wider than a phone/);
    assert.match(out, /min-w-\[640px\]/);
  });

  // Five individually reasonable column floors sum past a phone's card width. No
  // single one of them looks wrong, which is exactly why the rule sums them.
  const summed = fixture({
    "page.tsx": `export const A = () => (
      <TableCard>
        <Table><TableHeader><TableRow>
          <TableHead className="min-w-[140px]">A</TableHead>
          <TableHead className="min-w-[130px]">B</TableHead>
          <TableHead className="min-w-[110px]">C</TableHead>
          <TableHead className="min-w-[110px]">D</TableHead>
          <TableHead className="min-w-[110px]">E</TableHead>
        </TableRow></TableHeader></Table>
      </TableCard>
    );\n`,
  });
  withCleanup(summed, () => {
    const { code, out } = run(summed);
    assert.equal(code, 1);
    assert.match(out, /600px of column floors/);
  });

  for (const [name, code] of [
    ["a breakpoint-scoped table minimum", `<Table className="table-fixed sm:min-w-[460px]">`],
    ["one large floor on the identity column", `<Table>`],
  ]) {
    const body =
      name === "one large floor on the identity column"
        ? `<TableCell className="min-w-[12rem]">Country</TableCell>`
        : `<TableCell>Country</TableCell>`;
    const ok = fixture({
      "page.tsx": `export const A = () => (
        <TableCard>
          ${code}<TableHeader><TableRow>
            <TableHead className="w-10">#</TableHead><TableHead>Country</TableHead>
          </TableRow></TableHeader>
          <TableBody><TableRow>${body}<TableCell>1</TableCell></TableRow></TableBody>
        </Table>
        </TableCard>
      );\n`,
    });
    withCleanup(ok, () => {
      assert.equal(run(ok).code, 0, `should accept ${name}`);
    });
  }
});

test("prose in a comment may name a banned value", () => {
  // The rules in this system are documented at the point of use, and the house style
  // quotes the class being warned about. Before the literal scanner skipped comments,
  // the comment *explaining* a rewrite was reported as the drift it described.
  const documented = fixture({
    "page.tsx": [
      "/**",
      " * The previous version washed this card in `bg-chart-3/5` and lifted it on",
      " * hover with `hover:-translate-y-0.5`. Both are gone.",
      " */",
      "export const A = () => <div className=\"flex gap-3\" />;",
      "",
    ].join("\n"),
  });
  withCleanup(documented, () => {
    const { code, out } = run(documented);
    assert.equal(code, 0, out);
  });

  // A line comment is prose too, and the same rule applies.
  const inline = fixture({
    "page.tsx": `export const A = () => <div className="flex gap-3" />; // not \\\`text-[11px]\\\`\n`,
  });
  withCleanup(inline, () => {
    assert.equal(run(inline).code, 0);
  });

  // But the real thing next to a comment must still fail, or the rule is vacuous.
  const stillCaught = fixture({
    "page.tsx": `// the old card used \\\`bg-chart-3/5\\\`\nexport const A = () => <div className="bg-chart-3/5" />;\n`,
  });
  withCleanup(stillCaught, () => {
    const { code, out } = run(stillCaught);
    assert.equal(code, 1);
    assert.match(out, /surface tint/);
  });

  // A `//` inside a string is not a comment, and must not hide what follows it.
  const url = fixture({
    "page.tsx": `export const A = () => <a href="https://example.org">x</a>;\nexport const B = () => <div className="gap-2.5" />;\n`,
  });
  withCleanup(url, () => {
    const { code, out } = run(url);
    assert.equal(code, 1, "off-scale spacing after a URL must still be found");
    assert.match(out, /gap-2\.5/);
  });
});

test("generated components/ui is not audited", () => {
  const root = mkdtempSync(join(tmpdir(), "mri-audit-ui-"));
  mkdirSync(join(root, "components", "ui"), { recursive: true });
  writeFileSync(join(root, "components", "ui", "card.tsx"), `export const A = () => <div className="gap-2.5" />;\n`);
  withCleanup(root, () => {
    assert.equal(run(root).code, 0, "shadcn output is not our drift to fix");
  });
});

test("installed components/mri is not audited", () => {
  const root = mkdtempSync(join(tmpdir(), "mri-audit-ui-"));
  mkdirSync(join(root, "components", "mri"), { recursive: true });
  // Off-scale spacing *and* a raw table: both legal here because this layer is
  // installed from the registry and regenerated, never hand-edited.
  writeFileSync(
    join(root, "components", "mri", "patterns.tsx"),
    `export const A = () => <><div className="px-3.5" /><table /></>;\n`,
  );
  withCleanup(root, () => {
    assert.equal(run(root).code, 0, "registry-installed code is not our drift to fix");
  });
});

/* ------------------------------------------------------------- navigation */

test("fails on a navigation tree arranged by position, allows a computed layout", () => {
  // The footer bug: columns sliced for five groups; a sixth shifted every later one.
  const positional = fixture({
    "footer.tsx": `const columns = [SIDEBAR_NAV.slice(0, 2), SIDEBAR_NAV.slice(2, 3), SIDEBAR_NAV.slice(3)];\nconst first = TOP_NAV[0];\n`,
  });
  withCleanup(positional, () => {
    const { code, out } = run(positional);
    assert.equal(code, 1);
    assert.match(out, /navigation tree arranged by position/);
    assert.match(out, /SIDEBAR_NAV\.slice\(/);
    assert.match(out, /TOP_NAV\[0/);
  });

  // Mapping the whole tree or computing its columns is fine, and prose may name the bug.
  const computed = fixture({
    "footer.tsx": `// Never SIDEBAR_NAV.slice(0, 2): the columns are computed.\nconst columns = footerColumns(SIDEBAR_NAV, 3);\nconst labels = SIDEBAR_NAV.map((group) => group.label);\n`,
  });
  withCleanup(computed, () => {
    const { code, out } = run(computed);
    assert.equal(code, 0, out);
  });
});

/* ------------------------------------------------------------- card padding */

test("fails on a card with flush body or --card-spacing outside Card, allows CardContent", () => {
  const unpadded = fixture({
    "page.tsx": `export const A = () => <article className="bg-card"><div className="aspect-video"><img src="/x.jpg" /></div><div className="p-(--card-spacing)">Content</div></article>;\n`,
  });
  withCleanup(unpadded, () => {
    const { code, out } = run(unpadded);
    assert.equal(code, 1);
    assert.match(out, /unpadded or flush card body/);
  });

  const padded = fixture({
    "page.tsx": `export const A = () => <Card size="sm" className="p-0"><div className="aspect-video"><img src="/x.jpg" /></div><CardContent className="py-(--card-spacing)">Content</CardContent></Card>;\n`,
  });
  withCleanup(padded, () => {
    const { code, out } = run(padded);
    assert.equal(code, 0, out);
  });
});

test("allows a rule book or a specimen label to name the token in prose", () => {
  // The token is documented by writing it down. Reading the raw source flagged the
  // design system's own rule book and chart specimen labels as violations of the
  // rule they describe, so the scan reads className values only.
  const prose = fixture({
    "page.tsx": `export const DOC = { was: "p-(--card-spacing) silently never compiled." };\nexport const A = () => <Card size="sm" className="p-0"><div className="aspect-video"><img src="/x.jpg" /></div><CardContent className="py-(--card-spacing)">Content</CardContent></Card>;\n`,
  });
  withCleanup(prose, () => {
    const { code, out } = run(prose);
    assert.equal(code, 0, out);
  });
});

