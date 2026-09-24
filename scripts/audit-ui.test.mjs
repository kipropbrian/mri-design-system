/**
 * Tests for the UI audit's ratchet and structural rules.
 *
 * The audit is the gate the whole rewrite leans on, so its failure modes
 * are tested end to end: a new violation must fail, a baseline entry that
 * no longer occurs must fail, and structural anti-patterns (such as cards
 * inside tab panels causing layout shifts) are strictly caught.
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

test("fails on a raw table but allows the shared composition", () => {
  const raw = fixture({ "page.tsx": `export const A = () => <table><tbody /></table>;\n` });
  withCleanup(raw, () => {
    assert.equal(run(raw).code, 1);
  });

  const shared = fixture({ "page.tsx": `export const A = () => <table><tbody /></table>;\n` });
  mkdirSync(join(shared, "components", "ui"), { recursive: true });
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
});

/* --------------------------------------------------------------- tabs & CLS */

test("fails on a card inside tab content, allows a card wrapping tabs", () => {
  // 1. Panel inside TabsContent (the anti-pattern causing tab layout shift)
  const badPanel = fixture({
    "page.tsx": `export const A = () => (
      <Tabs defaultValue="history">
        <TabsList><TabsTrigger value="history">History</TabsTrigger></TabsList>
        <TabsContent value="history">
          <Panel title="Practice history">
            <Table><TableHeader><TableRow><TableHead>Date</TableHead></TableRow></TableHeader></Table>
          </Panel>
        </TabsContent>
      </Tabs>
    );\n`,
  });
  withCleanup(badPanel, () => {
    const { code, out } = run(badPanel);
    assert.equal(code, 1);
    assert.match(out, /card nested inside tab content/);
    assert.match(out, /<Panel> inside <TabsContent>/);
  });

  // 2. TableCard inside TabsContent
  const badTableCard = fixture({
    "page.tsx": `export const A = () => (
      <Tabs defaultValue="history">
        <TabsContent value="history">
          <TableCard title="History">
            <Table><TableHeader><TableRow><TableHead>Date</TableHead></TableRow></TableHeader></Table>
          </TableCard>
        </TabsContent>
      </Tabs>
    );\n`,
  });
  withCleanup(badTableCard, () => {
    const { code, out } = run(badTableCard);
    assert.equal(code, 1);
    assert.match(out, /card nested inside tab content/);
    assert.match(out, /<TableCard> inside <TabsContent>/);
  });

  // 3. Card inside TabsContent
  const badCard = fixture({
    "page.tsx": `export const A = () => (
      <Tabs defaultValue="history">
        <TabsContent value="history">
          <Card>
            <div>content</div>
          </Card>
        </TabsContent>
      </Tabs>
    );\n`,
  });
  withCleanup(badCard, () => {
    const { code, out } = run(badCard);
    assert.equal(code, 1);
    assert.match(out, /card nested inside tab content/);
    assert.match(out, /<Card> inside <TabsContent>/);
  });

  // 4. Clean MRI pattern: TableCard wraps Tabs with TabsList in action
  const good = fixture({
    "page.tsx": `export const A = () => (
      <Tabs defaultValue="history">
        <TableCard
          title="History"
          action={
            <TabsList>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="retention">Retention</TabsTrigger>
            </TabsList>
          }
        >
          <TabsContent value="history">
            <Table><TableHeader><TableRow><TableHead>Date</TableHead></TableRow></TableHeader></Table>
          </TabsContent>
          <TabsContent value="retention">
            <Table><TableHeader><TableRow><TableHead>Date</TableHead></TableRow></TableHeader></Table>
          </TabsContent>
        </TableCard>
      </Tabs>
    );\n`,
  });
  withCleanup(good, () => {
    const { code, out } = run(good);
    assert.equal(code, 0, out);
  });
});

test("prose in a comment may name a banned value", () => {
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
  writeFileSync(
    join(root, "components", "mri", "patterns.tsx"),
    `export const A = () => <><div className="px-3.5" /><table /></>;\n`,
  );
  withCleanup(root, () => {
    assert.equal(run(root).code, 0, "registry-installed code is not our drift to fix");
  });
});

test("fails on standalone <hr> directly inside <PageContainer>, allows intra-section <hr>", () => {
  const badHr = fixture({
    "page.tsx": `export const A = () => (
      <PageContainer>
        <section>Section 1</section>
        <hr className="border-border/60" />
        <section>Section 2</section>
      </PageContainer>
    );\n`,
  });
  withCleanup(badHr, () => {
    const { code, out } = run(badHr);
    assert.equal(code, 1);
    assert.match(out, /standalone <hr> directly inside <PageContainer>/);
  });

  const good = fixture({
    "page.tsx": `export const A = () => (
      <PageContainer>
        <section className="grid gap-6">
          <Specimen>
            <div>Item 1</div>
            <hr className="border-border/40" />
            <div>Item 2</div>
          </Specimen>
        </section>
        <section className="grid gap-6 border-t border-border/60 pt-6">
          <div>Section 2</div>
        </section>
      </PageContainer>
    );\n`,
  });
  withCleanup(good, () => {
    const { code } = run(good);
    assert.equal(code, 0);
  });
});

