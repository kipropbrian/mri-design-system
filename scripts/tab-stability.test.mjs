/**
 * Tests for Tab Structural Stability and Zero Cumulative Layout Shift (CLS).
 *
 * Verifies that tabbed specimens in the design system (such as the Quiz
 * review specimen) maintain complete structural parity across tab switches:
 * - Shared TableCard container (TabsList in action, pagination in footer)
 * - Zero nested cards inside TabsContent (enforced by audit-ui cardInTabs)
 * - Row count parity between sibling tab tables (avoiding vertical height jumps)
 * - Matching caption structure
 *
 *   node --test scripts/tab-stability.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const QUIZ_PAGE = join(new URL("..", import.meta.url).pathname, "app", "pages", "quiz", "page.tsx");

test("quiz review page tabs maintain structural container parity", () => {
  const source = readFileSync(QUIZ_PAGE, "utf8");

  // 1. Must use TableCard as the unified container wrapping the tabs
  assert.match(
    source,
    /<TableCard\b[\s\S]*?action=\{\s*<TabsList>[\s\S]*?<\/TabsList>\s*\}/,
    "TabsList must reside in the TableCard's action slot to anchor controls in the header",
  );

  // 2. Footer must be shared on TableCard rather than isolated inside a single tab
  assert.match(
    source,
    /<TableCard\b[\s\S]*?footer=\{\s*<div\b[\s\S]*?<Pagination\b/,
    "Pagination footer must belong to TableCard so both tabs share the same footer frame",
  );

  // 3. No Card or Panel inside TabsContent
  const tabsContentMatches = [...source.matchAll(/<TabsContent\b[^>]*>([\s\S]*?)<\/TabsContent>/g)];
  assert.ok(tabsContentMatches.length >= 2, "Quiz page must define at least two TabsContent panels");

  for (const match of tabsContentMatches) {
    const body = match[1];
    assert.doesNotMatch(body, /<(Panel|Card|TableCard|ChartFrame)\b/, "TabsContent must never wrap a card or panel");
  }

  // 4. Parity in row counts between history and mastery tabs
  const historyContent = source.match(/<TabsContent value="history">([\s\S]*?)<\/TabsContent>/)?.[1] ?? "";
  const masteryContent = source.match(/<TabsContent value="mastery">([\s\S]*?)<\/TabsContent>/)?.[1] ?? "";

  assert.ok(historyContent, "History tab content must be present");
  assert.ok(masteryContent, "Mastery tab content must be present");

  // History renders HISTORY.map; mastery renders birds.featured.slice(0, 6)
  // Both must evaluate to 6 rows to prevent height shift
  assert.match(historyContent, /\{HISTORY\.map\(/, "History tab must map HISTORY rows");
  assert.match(masteryContent, /slice\(0,\s*6\)/, "Mastery tab must render exactly 6 rows to match history row count");

  // Both must include TableCaption for caption height parity
  assert.match(historyContent, /<TableCaption>/, "History tab must include TableCaption");
  assert.match(masteryContent, /<TableCaption>/, "Mastery tab must include TableCaption");
});

test("quiz page eliminates duplicate sections and specimens", () => {
  const source = readFileSync(QUIZ_PAGE, "utf8");

  // Must not have duplicate Pre-game section
  assert.doesNotMatch(source, /eyebrow="Pre-game"/, "Duplicate Pre-game section must not exist");
  assert.doesNotMatch(source, /label="state · start screen/, "Duplicate start screen specimen must not exist outside preview");
  assert.doesNotMatch(source, /label="state · completed today/, "Duplicate completed today specimen must not exist");
  assert.doesNotMatch(source, /label="state · session summary/, "Duplicate session summary specimen must not exist");

  // Section headers must follow standardized top hairline divider
  const sectionMatches = [...source.matchAll(/<section className="([^"]+)">/g)];
  for (const match of sectionMatches) {
    assert.match(
      match[1],
      /border-t border-border\/60 pt-6/,
      "Major quiz sections must follow top hairline divider standard",
    );
  }
});

test("quiz preview maintains 12-column structural stability across all states", () => {
  const quizPreviewPath = join(new URL("..", import.meta.url).pathname, "components", "site", "quiz-preview.tsx");
  const source = readFileSync(quizPreviewPath, "utf8");

  // 1. Progress indicators must be anchored outside stage conditionals so they persist across all states
  assert.match(
    source,
    /<ProgressChips[\s\S]*?<div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-12/,
    "ProgressChips header must be persistent above main surface to prevent layout shifts",
  );

  // 2. All states (start, question, reveal, summary) must adhere to 5-col / 7-col split
  assert.match(source, /stage === "start"[\s\S]*?lg:col-span-5[\s\S]*?lg:col-span-7/, "Start state must use 5/7 column split");
  assert.match(source, /stage === "question"[\s\S]*?lg:col-span-5[\s\S]*?lg:col-span-7/, "Question state must use 5/7 column split");
  assert.match(source, /stage === "reveal"[\s\S]*?lg:col-span-5[\s\S]*?lg:col-span-7/, "Reveal state must use 5/7 column split");
  assert.match(source, /stage === "summary"[\s\S]*?lg:col-span-5[\s\S]*?lg:col-span-7/, "Summary state must use 5/7 column split");
});

test("text on images strictly enforces overlay rules across components", () => {
  const quizPreviewPath = join(new URL("..", import.meta.url).pathname, "components", "site", "quiz-preview.tsx");
  const platformPagePath = join(new URL("..", import.meta.url).pathname, "app", "pages", "platform", "page.tsx");
  const specimenCardPath = join(new URL("..", import.meta.url).pathname, "components", "mri", "specimen-card.tsx");

  const quizSource = readFileSync(quizPreviewPath, "utf8");
  const platformSource = readFileSync(platformPagePath, "utf8");
  const specimenSource = readFileSync(specimenCardPath, "utf8");

  // 1. Reveal state must NEVER put a flow StatusBadge on the image frame
  const revealBlock = quizSource.match(/stage === "reveal"\s*\?([\s\S]*?): null/)?.[1] ?? "";
  assert.ok(revealBlock, "Reveal block must exist");
  const revealMediaCol = revealBlock.match(/lg:col-span-5[\s\S]*?<div className="relative aspect-\[4\/3\]([\s\S]*?)<\/div>\s*<\/div>/)?.[1] ?? "";
  assert.ok(revealMediaCol, "Reveal media frame must exist");
  assert.doesNotMatch(
    revealMediaCol,
    /<StatusBadge\b/,
    "Never place flow StatusBadge on an image (10% tint is unreadable on arbitrary backgrounds)",
  );

  // 2. Chips on images must explicitly use surface="overlay"
  assert.match(
    revealMediaCol,
    /<Chip\s+surface="overlay"\s+appearance=\{isCorrect\s*\?\s*"highlight"\s*:\s*"dark"\}/,
    "Reveal screen must use scrimmed overlay chip for answer status",
  );

  // 3. Platform page field tools media cards must use OverlayCaption instead of raw token gradients
  assert.doesNotMatch(
    platformSource,
    /bg-gradient-to-t from-foreground/,
    "Platform page must not use theme-inverting token gradient on photographs",
  );
  assert.match(
    platformSource,
    /<OverlayCaption>/,
    "Platform page must use OverlayCaption for photograph attribution/captioning",
  );

  // 4. Specimen card must follow overlay rules
  assert.match(
    specimenSource,
    /<Chip\s+surface="overlay"/,
    "Specimen card chips over photos must declare surface='overlay'",
  );
  assert.match(
    specimenSource,
    /<OverlayCaption>/,
    "Specimen card attribution must use OverlayCaption",
  );
});
