import type { Metadata } from "next";
import {
  ArrowSquareOutIcon,
  CheckIcon,
  FireIcon,
  HeadphonesIcon,
  LockIcon,
  ShieldCheckIcon,
  TrophyIcon,
  WaveformIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Eyebrow, PageContainer, PageHeader, SectionHeader, Specimen } from "@/components/mri/layout";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  MetricStrip,
  Panel,
  SourceNote,
  StatusBadge,
  TableSkeleton,
} from "@/components/mri/patterns";
import { QuizPreview, type QuizQuestion } from "@/components/site/quiz-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { birds } from "@/lib/data";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Bird sound quiz",
  description:
    "Acoustic identification practice: interactive question and reveal states, plus summary, history and access-gate compositions.",
};

const HISTORY = [
  { date: "13 Sep 2026", score: 4, total: 5, streak: 12, seconds: 74 },
  { date: "12 Sep 2026", score: 3, total: 5, streak: 11, seconds: 88 },
  { date: "11 Sep 2026", score: 5, total: 5, streak: 10, seconds: 61 },
  { date: "10 Sep 2026", score: 2, total: 5, streak: 9, seconds: 102 },
  { date: "9 Sep 2026", score: 4, total: 5, streak: 8, seconds: 79 },
  { date: "8 Sep 2026", score: 3, total: 5, streak: 7, seconds: 91 },
];

export default function QuizPage() {
  const [answer, ...distractors] = birds.featured;

  const question: QuizQuestion = {
    answerCode: answer.speciesCode,
    image: answer.image,
    region: "Rwanda · Nyungwe forest",
    recordings: answer.xenoCount,
    options: [answer, ...distractors.slice(0, 3)]
      .map((record) => ({
        code: record.speciesCode,
        commonName: record.commonName,
        scientificName: record.scientificName,
      }))
      .sort((a, b) => a.commonName.localeCompare(b.commonName)),
  };

  const accuracy = Math.round(
    (HISTORY.reduce((sum, row) => sum + row.score, 0) / (HISTORY.length * 5)) * 100,
  );

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Acoustic identification"
        title="Can you name the call?"
        description="Five randomised recordings per day, drawn from the regional checklist with plausible same-habitat candidates. Listen, answer, then see the species and its photograph."
        status={
          <>
            <StatusBadge tone="positive">
              <ShieldCheckIcon className="size-3" weight="fill" />
              1,153 species with audio
            </StatusBadge>
            <Badge variant="outline" className="gap-1">
              <FireIcon className="size-3 text-notable" />
              <span className="tabular-nums">12 day streak</span>
            </Badge>
            <Badge variant="outline">One session per day</Badge>
          </>
        }
        actions={
          <Button nativeButton={false}
            variant="outline"
            render={<a href="https://xeno-canto.org" target="_blank" rel="noreferrer" />}
          >
            Browse source audio
            <ArrowSquareOutIcon data-icon="inline-end" />
          </Button>
        }
      />

      {/* Session numbers belong in a metric strip, where every other page puts
          them — not inside the hero card, where they were only filling space. */}
      <MetricStrip label="Quiz scope">
        <MetricCard
          label="Session size"
          value="5 calls"
          detail="One session per day"
          icon={<HeadphonesIcon className="size-3" />}
        />
        <MetricCard
          label="Species catalogue"
          value={formatNumber(birds.totalSpecies)}
          detail={`${formatNumber(birds.xeno.totals.speciesWithAudio)} with audio`}
          icon={<WaveformIcon className="size-3" />}
        />
        <MetricCard
          label="Last score"
          value="3 / 5"
          detail="60% accuracy"
          icon={<CheckIcon className="size-3" />}
        />
        <MetricCard
          label="Practice streak"
          value="12 days"
          detail="147 calls to date"
          icon={<FireIcon className="size-3" />}
        />
      </MetricStrip>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Interactive"
          title="Question and reveal"
          description="One component, two states. Start the set, answer, and the same frame reveals the species with the recording context intact. Playback is simulated in this template — no audio file ships with the design system."
          action={<Badge variant="secondary">Try it</Badge>}
        />
        <QuizPreview question={question} />
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="States"
          title="Session summary and history"
          description="After the fifth call the same card becomes a summary, and the history view reuses the standard table and pagination patterns."
        />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Specimen label="state · session complete" note="three stats, one primary action">
            <Panel contentClassName="grid gap-4">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge tone="positive">
                  <TrophyIcon className="size-3" weight="fill" />
                  Session complete
                </StatusBadge>
                <span className="text-[0.6875rem] text-muted-foreground">13 Sep 2026</span>
              </div>

              <div className="grid gap-1 text-center">
                <p className="text-3xl font-medium tabular-nums text-foreground">4 / 5</p>
                <p className="text-[0.6875rem] text-muted-foreground">
                  80% accuracy · 74 seconds average
                </p>
              </div>

              <Progress value={80}>
                <span className="text-[0.6875rem] font-medium text-foreground">Daily progress</span>
                <span className="ml-auto font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
                  80%
                </span>
              </Progress>

              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  { term: "Today", value: "1", note: "session" },
                  { term: "Streak", value: "12", note: "days" },
                  { term: "Lifetime", value: "147", note: "calls" },
                ].map((row) => (
                  <div key={row.term} className="rounded-md bg-muted/50 p-3">
                    <dt className="text-[0.625rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                      {row.term}
                    </dt>
                    <dd className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                      {row.value}
                    </dd>
                    <p className="text-[0.625rem] text-muted-foreground">{row.note}</p>
                  </div>
                ))}
              </dl>

              <div className="grid gap-2">
                {[
                  { name: answer.commonName, scientific: answer.scientificName, correct: true },
                  {
                    name: distractors[0]?.commonName ?? "—",
                    scientific: distractors[0]?.scientificName ?? "—",
                    correct: false,
                  },
                ].map((row) => (
                  <div
                    key={row.scientific}
                    className={
                      row.correct
                        ? "flex items-center justify-between gap-2 rounded-md bg-primary/10 p-3 ring-1 ring-primary/30"
                        : "flex items-center justify-between gap-2 rounded-md bg-muted/40 p-3"
                    }
                  >
                    <span className="grid min-w-0">
                      <span className="truncate text-xs/relaxed font-medium text-foreground">
                        {row.name}
                      </span>
                      <span className="truncate font-serif text-[0.6875rem] italic text-muted-foreground">
                        {row.scientific}
                      </span>
                    </span>
                    <Badge variant={row.correct ? "default" : "destructive"} className="shrink-0 gap-1">
                      {row.correct ? <CheckIcon /> : <XIcon />}
                      {row.correct ? "Target" : "Your answer"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Panel>
          </Specimen>

          <Specimen label="history · practice table" note="shares the standard table and pagination">
            <Panel
              title={`Practice history (${HISTORY.length} sessions)`}
              description={`Lifetime accuracy ${accuracy}%`}
              action={<Badge variant="outline">Last 6 sessions</Badge>}
              contentClassName="grid gap-0 p-0"
            >
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Date</TableHead>
        <TableHead className="text-right">Score</TableHead>
        <TableHead className="text-right">Accuracy</TableHead>
        <TableHead className="hidden text-right sm:table-cell">Avg time</TableHead>
        <TableHead className="text-right">Streak</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {HISTORY.map((row) => (
        <TableRow key={row.date}>
          <TableCell className="text-[0.6875rem] tabular-nums text-muted-foreground">
            {row.date}
          </TableCell>
          <TableCell className="text-right font-medium tabular-nums text-foreground">
            {row.score}/{row.total}
          </TableCell>
          <TableCell className="text-right">
            <span className="inline-flex items-center justify-end gap-2">
              <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                <span
                  className={
                    row.score >= 4
                      ? "block h-full rounded-full bg-primary"
                      : "block h-full rounded-full bg-chart-4"
                  }
                  style={{ width: `${(row.score / row.total) * 100}%` }}
                />
              </span>
              <span className="w-8 text-right tabular-nums text-muted-foreground">
                {Math.round((row.score / row.total) * 100)}%
              </span>
            </span>
          </TableCell>
          <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
            {row.seconds}s
          </TableCell>
          <TableCell className="text-right tabular-nums text-muted-foreground">
            {row.streak}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableCaption>
      One session per day counts toward the streak; practice sessions do not.
    </TableCaption>
  </Table>
              <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 p-3 sm:flex-row">
                <p className="order-2 text-[0.6875rem] text-muted-foreground sm:order-1">
                  Showing{" "}
                  <span className="font-medium tabular-nums text-foreground">1</span>–
                  <span className="font-medium tabular-nums text-foreground">6</span> of{" "}
                  <span className="font-medium tabular-nums text-foreground">147</span> sessions
                </p>
                <Pagination className="order-1 mx-0 w-auto sm:order-2">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink isActive>1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink>2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </Panel>
          </Specimen>
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          eyebrow="Gates"
          title="Access and failure states"
          description="The quiz is the one signed-in surface on the platform, so its loading, gated, empty and error states are part of the design, not an afterthought."
        />
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          <Specimen label="loading · verifying access">
            <LoadingState
              title="Checking access…"
              description="Verifying reviewer permissions and loading the private bioacoustics manifest."
            />
          </Specimen>

          <Specimen label="gated · sign in required">
            <div className="grid h-full gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
              <div className="grid justify-items-center gap-2">
                <span className="grid size-8 place-items-center rounded-md bg-muted text-foreground">
                  <LockIcon className="size-4" />
                </span>
                <p className="font-heading text-sm font-medium text-foreground">Sign in to play</p>
                <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                  Scores and streaks are tied to your MRI account so practice history follows you across
                  devices.
                </p>
              </div>
              <div className="grid content-end gap-2">
                <Button size="sm">
                  <HeadphonesIcon data-icon="inline-start" />
                  Sign in and start
                </Button>
                <Button size="sm" variant="ghost">
                  Continue as guest
                </Button>
              </div>
            </div>
          </Specimen>

          <Specimen label="empty · no session today">
            <EmptyState
              title="Today’s set is not ready"
              description="The daily rotation is generated at 05:00 EAT. Come back shortly, or review yesterday’s calls."
              action={
                <Button variant="outline" size="sm">
                  Review yesterday
                </Button>
              }
            />
          </Specimen>

          <Specimen label="error · quiz unavailable">
            <ErrorState
              title="Quiz unavailable"
              description="The recording manifest could not be loaded. The rest of the platform is unaffected."
              action={
                <Button variant="outline" size="sm">
                  Retry
                </Button>
              }
            />
          </Specimen>
        </div>

        <Specimen label="loading · manifest table" note="same table geometry as the history view">
          <TableSkeleton rows={5} columns={5} label="Loading practice history" />
        </Specimen>
      </section>

      <Specimen label="provenance" note="closes the quiz">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-3 ring-1 ring-foreground/10">
          <div className="grid gap-1">
            <SourceNote>
              Recordings stream from Xeno-canto · {formatNumber(birds.xeno.totals.recordings)} available ·{" "}
              {formatNumber(birds.xeno.totals.speciesWithAudio)} species
            </SourceNote>
            <SourceNote>
              Candidate species and photographs from the regional checklist and Macaulay Library
            </SourceNote>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info">Playback simulated in this template</StatusBadge>
            <Eyebrow className="text-muted-foreground">Composition 05 · practice tool</Eyebrow>
          </div>
        </div>
      </Specimen>
    </PageContainer>
  );
}
