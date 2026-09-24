"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  CheckIcon,
  CompassIcon,
  FireIcon,
  HeadphonesIcon,
  KeyboardIcon,
  PlayIcon,
  ShareNetworkIcon,
  SparkleIcon,
  SpeakerHighIcon,
  TrophyIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/mri/audio-player";
import { Chip, OverlayCaption } from "@/components/mri/chips";
import { Panel, StatusBadge } from "@/components/mri/patterns";
import { cn } from "cn";

export interface QuizOption {
  code: string;
  commonName: string;
  scientificName: string;
}

export interface QuizQuestion {
  answerCode: string;
  image: string | null;
  options: QuizOption[];
  region: string;
  recordings: number;
  xcId?: string;
  recordist?: string;
  license?: string;
}

const KEY_LABELS = ["A", "B", "C", "D"] as const;
const SIMULATED_SECONDS = 18;

const SAMPLE_SUMMARY_BIRDS = [
  { name: "African Paradise-Flycatcher", scientific: "Terpsiphone viridis", correct: true, duration: "18s" },
  { name: "White-browed Robin-Chat", scientific: "Cossypha heuglini", correct: true, duration: "24s" },
  { name: "Red-chested Cuckoo", scientific: "Cuculus solitarius", correct: true, duration: "15s" },
  { name: "Chubb's Cisticola", scientific: "Cisticola chubbi", correct: false, missedChoice: "Northern Wheatear", duration: "31s" },
  { name: "Baglafecht Weaver", scientific: "Ploceus baglafecht", correct: true, duration: "20s" },
];

function useSimulatedPlayback() {
  const [isPlaying, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => {
        if (value >= SIMULATED_SECONDS) {
          setPlaying(false);
          return SIMULATED_SECONDS;
        }
        return value + 0.25;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const toggle = useCallback(() => {
    setPlaying((value) => {
      if (!value && elapsed >= SIMULATED_SECONDS) setElapsed(0);
      return !value;
    });
  }, [elapsed]);

  const seek = useCallback((fraction: number) => {
    setElapsed(Math.round(fraction * SIMULATED_SECONDS));
  }, []);

  const replay = useCallback(() => {
    setElapsed(0);
    setPlaying(true);
  }, []);

  return { isPlaying, elapsed, toggle, seek, replay };
}

function ProgressChips({
  stage,
  questionIndex,
  total,
  results,
}: {
  stage: "start" | "question" | "reveal" | "summary";
  questionIndex: number;
  total: number;
  results: (boolean | null)[];
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/50 px-4 py-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, index) => {
          const result = results[index];
          const isActive = stage !== "start" && stage !== "summary" && index === questionIndex;
          return (
            <span
              key={index}
              aria-label={`Call ${index + 1}${result === true ? " correct" : result === false ? " incorrect" : ""}`}
              className={cn(
                "grid size-7 place-items-center rounded-md text-[0.6875rem] font-medium tabular-nums transition-colors",
                isActive && "bg-primary text-primary-foreground",
                !isActive && result === true && "bg-primary/10 text-primary-ink",
                !isActive && result === false && "bg-destructive/10 text-destructive",
                !isActive && result === null && "bg-muted text-muted-foreground",
              )}
            >
              {result === true && !isActive ? (
                <CheckIcon className="size-3.5" weight="bold" />
              ) : result === false && !isActive ? (
                <XIcon className="size-3.5" weight="bold" />
              ) : (
                index + 1
              )}
            </span>
          );
        })}
      </div>
      <span className="text-[0.6875rem] text-muted-foreground">
        {stage === "start" ? (
          <span>Today&apos;s daily set · <strong className="font-medium text-foreground tabular-nums">5 calls</strong></span>
        ) : stage === "summary" ? (
          <span>Session complete · <strong className="font-medium text-foreground tabular-nums">4 of 5 correct</strong></span>
        ) : (
          <span>
            Call <strong className="font-medium text-foreground tabular-nums">{questionIndex + 1}</strong> of{" "}
            <strong className="font-medium text-foreground tabular-nums">{total}</strong>
          </span>
        )}
      </span>
    </div>
  );
}

export function QuizPreview({ question }: { question: QuizQuestion }) {
  const [stage, setStage] = useState<"start" | "question" | "reveal" | "summary">("start");
  const [selected, setSelected] = useState<string | null>(null);
  const { isPlaying, elapsed, toggle, seek, replay } = useSimulatedPlayback();

  const answer = useMemo(
    () => question.options.find((option) => option.code === question.answerCode) ?? question.options[0],
    [question],
  );
  const isCorrect = selected === question.answerCode;

  const reset = () => {
    setSelected(null);
    setStage("question");
  };

  const resultsForHeader: (boolean | null)[] = useMemo(() => {
    if (stage === "summary") return [true, true, true, false, true];
    if (stage === "reveal") return [isCorrect, null, null, null, null];
    return [null, null, null, null, null];
  }, [stage, isCorrect]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card/40">
      {/* Dev / Design System state switcher toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-3 py-2 text-xs">
        <span className="font-medium text-xs text-muted-foreground">
          Interactive preview state
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant={stage === "start" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setStage("start");
              setSelected(null);
            }}
          >
            Start
          </Button>
          <Button
            type="button"
            variant={stage === "question" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setStage("question");
              setSelected(null);
            }}
          >
            Question
          </Button>
          <Button
            type="button"
            variant={stage === "reveal" && isCorrect ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setStage("reveal");
              setSelected(question.answerCode);
            }}
          >
            <CheckIcon className="size-3 text-primary-ink" weight="bold" />
            Reveal (Correct)
          </Button>
          <Button
            type="button"
            variant={stage === "reveal" && !isCorrect && selected !== null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setStage("reveal");
              const wrong = question.options.find((o) => o.code !== question.answerCode) ?? question.options[1];
              setSelected(wrong.code);
            }}
          >
            <XIcon className="size-3 text-destructive" weight="bold" />
            Reveal (Missed)
          </Button>
          <Button
            type="button"
            variant={stage === "summary" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setStage("summary");
            }}
          >
            <TrophyIcon className="size-3 text-notable" weight="fill" />
            Summary
          </Button>
        </div>
      </div>

      {/* Persistent Progress Header */}
      <ProgressChips
        stage={stage}
        questionIndex={0}
        total={5}
        results={resultsForHeader}
      />

      {/* Main interactive surface with locked height parity */}
      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-12 lg:items-stretch lg:gap-6">
        {/* ========================================================
            STAGE 1: START SCREEN (No wasted space, matched 4:3 frame)
           ======================================================== */}
        {stage === "start" ? (
          <>
            {/* Left 5 cols: Today's featured media (aspect 4/3) */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 group">
                <img
                  src="/quiz/forest-clearing-frame.webp"
                  alt="African Paradise-Flycatcher perched in East Africa"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-1.5">
                  <Chip surface="overlay" appearance="highlight">
                    Today&apos;s featured call
                  </Chip>
                  <Chip surface="overlay" appearance="dark">
                    Nyungwe, Rwanda
                  </Chip>
                </div>
                <OverlayCaption>
                  African Paradise-Flycatcher · Nyungwe forest, Rwanda
                </OverlayCaption>
              </div>
            </div>

            {/* Right 7 cols: Predefined Panel component redesigned from scratch */}
            <div className="lg:col-span-7">
              <Panel
                title="East Africa bird sound quiz"
                description="5 verified regional field recordings · Daily ear training"
                action={
                  <StatusBadge tone="notable">
                    <FireIcon className="size-3 text-notable" weight="fill" />
                    <span className="tabular-nums">12 day streak</span>
                  </StatusBadge>
                }
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <KeyboardIcon className="size-3.5" />
                      Press <Kbd>Space</Kbd> to play/pause, <Kbd>A</Kbd>–<Kbd>D</Kbd> to answer
                    </span>
                    <Button type="button" onClick={() => setStage("question")}>
                      Start today’s session
                      <PlayIcon data-icon="inline-end" weight="fill" />
                    </Button>
                  </div>
                }
                className="h-full flex flex-col justify-between"
              >
                <div className="grid gap-3">
                  {/* 3 session feature cards */}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <HeadphonesIcon className="size-3.5 text-primary" weight="bold" />
                        <span>5 Field calls</span>
                      </div>
                      <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                        Authentic regional field audio drawn from verified checklist archives.
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <SparkleIcon className="size-3.5 text-primary" weight="bold" />
                        <span>4 Candidates</span>
                      </div>
                      <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                        Plausible sympatric species sharing habitat and acoustic frequency.
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <ArrowsClockwiseIcon className="size-3.5 text-primary" weight="bold" />
                        <span>Adaptive recall</span>
                      </div>
                      <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                        Missed calls are weighted to return in future sets to solidify memory.
                      </p>
                    </div>
                  </div>

                  {/* Field focus note */}
                  <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary-ink">
                      <CompassIcon className="size-4" weight="bold" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">
                          Today&apos;s Focus: Montane Canopy &amp; Understory
                        </span>
                        <span className="font-mono text-[0.625rem] text-muted-foreground">
                          Rwanda · Set #48
                        </span>
                      </div>
                      <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
                        Featured recordings test distinction between rapid trills and clear territorial whistles. Listen for tonal purity versus buzzy harmonic overtones before answering.
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          </>
        ) : null}

        {/* ========================================================
            STAGE 2: QUESTION (Matching 4:3 frame with AudioPlayer overlay)
           ======================================================== */}
        {stage === "question" ? (
          <>
            {/* Left 5 cols: Mystery recording frame with AudioPlayer overlay (aspect 4/3) */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 group">
                <img
                  src="/quiz/forest-clearing-frame.webp"
                  alt="Field recording setting in Nyungwe forest"
                  className="size-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-1.5">
                  <Chip surface="overlay" appearance="dark">
                    Call 1 of 5
                  </Chip>
                  <Chip surface="overlay" appearance="dark">
                    {question.xcId || "XC842190"}
                  </Chip>
                </div>
                <div className="absolute inset-x-2 bottom-2">
                  <AudioPlayer
                    surface="overlay"
                    isPlaying={isPlaying}
                    currentTime={elapsed}
                    duration={SIMULATED_SECONDS}
                    onTogglePlay={toggle}
                    onReplay={replay}
                    onSeek={seek}
                    label="Mystery call"
                  />
                </div>
              </div>
            </div>

            {/* Right 7 cols: Predefined Panel with 4 choices */}
            <div className="lg:col-span-7">
              <Panel
                title="Which species is calling?"
                description="Listen to the recording and choose from the four regional candidates below."
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[0.6875rem] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <KeyboardIcon className="size-3.5" />
                      Press <Kbd>A</Kbd>–<Kbd>D</Kbd> to answer, <Kbd>Space</Kbd> to play/pause
                    </span>
                    <span className="font-mono tabular-nums">4 candidates</span>
                  </div>
                }
                className="h-full flex flex-col justify-between"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {question.options.map((option, index) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        setSelected(option.code);
                        setStage("reveal");
                      }}
                      className="group flex items-center gap-3 rounded-lg bg-background p-3 text-left ring-1 ring-foreground/10 transition-colors hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted font-mono text-[0.6875rem] font-medium text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        {KEY_LABELS[index]}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs/relaxed font-medium text-foreground">
                          {option.commonName}
                        </span>
                        <span className="block truncate font-serif text-[0.6875rem] italic text-muted-foreground">
                          {option.scientificName}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        ) : null}

        {/* ========================================================
            STAGE 3: REVEAL (Matching 4:3 frame with revealed bird + AudioPlayer)
           ======================================================== */}
        {stage === "reveal" ? (
          <>
            {/* Left 5 cols: Revealed species photograph + AudioPlayer overlay (aspect 4/3) */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 group">
                {question.image ? (
                  <img
                    src={question.image}
                    alt={`${answer.commonName} (${answer.scientificName})`}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-4xl" aria-hidden="true">
                    🦜
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-1.5">
                  <Chip
                    surface="overlay"
                    appearance={isCorrect ? "highlight" : "dark"}
                    icon={isCorrect ? <CheckIcon className="size-3" weight="bold" /> : <XIcon className="size-3" weight="bold" />}
                  >
                    {isCorrect ? "Correct identification" : "Missed identification"}
                  </Chip>
                  <Chip surface="overlay" appearance="dark">
                    {question.xcId || "XC842190"}
                  </Chip>
                </div>
                <div className="absolute inset-x-2 bottom-2">
                  <AudioPlayer
                    surface="overlay"
                    isPlaying={isPlaying}
                    currentTime={elapsed}
                    duration={SIMULATED_SECONDS}
                    onTogglePlay={toggle}
                    onReplay={replay}
                    onSeek={seek}
                    label={answer.commonName}
                  />
                </div>
              </div>
            </div>

            {/* Right 7 cols: Predefined Panel with highlighted choices */}
            <div className="lg:col-span-7">
              <Panel
                title={answer.commonName}
                description={
                  <span className="font-serif italic text-muted-foreground">
                    {answer.scientificName}
                  </span>
                }
                action={
                  <StatusBadge tone={isCorrect ? "positive" : "negative"}>
                    {isCorrect ? "Correct" : "Missed"}
                  </StatusBadge>
                }
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <Button variant="outline" size="sm" onClick={reset}>
                      <ArrowCounterClockwiseIcon data-icon="inline-start" />
                      Try again
                    </Button>
                    <Button size="sm" onClick={() => setStage("summary")}>
                      Next call
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                  </div>
                }
                className="h-full flex flex-col justify-between"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {question.options.map((option, index) => {
                    const chosen = selected === option.code;
                    const correct = option.code === question.answerCode;

                    return (
                      <div
                        key={option.code}
                        className={cn(
                          "flex items-center gap-3 rounded-lg bg-background p-3 text-left ring-1 ring-foreground/10 transition-colors",
                          correct && "bg-primary/10 ring-primary/40",
                          chosen && !correct && "bg-destructive/10 ring-destructive/40",
                          !correct && !chosen && "opacity-60",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-7 shrink-0 place-items-center rounded-md bg-muted font-mono text-[0.6875rem] font-medium text-muted-foreground",
                            correct && "bg-primary text-primary-foreground",
                            chosen && !correct && "bg-destructive text-background",
                          )}
                        >
                          {correct ? (
                            <CheckIcon className="size-3.5" weight="bold" />
                          ) : chosen ? (
                            <XIcon className="size-3.5" weight="bold" />
                          ) : (
                            KEY_LABELS[index]
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs/relaxed font-medium text-foreground">
                            {option.commonName}
                          </span>
                          <span className="block truncate font-serif text-[0.6875rem] italic text-muted-foreground">
                            {option.scientificName}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>
          </>
        ) : null}

        {/* ========================================================
            STAGE 4: SUMMARY (Predefined Panels with score & review)
           ======================================================== */}
        {stage === "summary" ? (
          <>
            {/* Left 5 cols: Predefined Panel for Score gauge */}
            <div className="lg:col-span-5">
              <Panel
                title="Today's score"
                description="A complete session is five calls, one point each."
                action={
                  <StatusBadge tone="positive">
                    <TrophyIcon className="size-3" weight="fill" />
                    Complete
                  </StatusBadge>
                }
                footer={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" onClick={() => { setSelected(null); setStage("start"); }}>
                      <ArrowCounterClockwiseIcon data-icon="inline-start" />
                      Practice again
                    </Button>
                    <Button size="sm" variant="outline">
                      <ShareNetworkIcon data-icon="inline-start" />
                      Share
                    </Button>
                  </div>
                }
                className="h-full flex flex-col justify-between"
              >
                <div className="grid gap-3 text-center">
                  <div>
                    <p className="text-3xl font-medium tabular-nums text-foreground">4 / 5</p>
                    <p className="text-[0.6875rem] text-muted-foreground">80% accuracy · 74s average</p>
                  </div>
                  <Progress value={80} />
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="rounded bg-muted/40 p-2">
                      <span className="block text-[0.625rem] text-muted-foreground uppercase font-medium">Today</span>
                      <span className="font-semibold text-foreground">1 set</span>
                    </div>
                    <div className="rounded bg-muted/40 p-2">
                      <span className="block text-[0.625rem] text-muted-foreground uppercase font-medium">Streak</span>
                      <span className="font-semibold text-foreground">12 days</span>
                    </div>
                    <div className="rounded bg-muted/40 p-2">
                      <span className="block text-[0.625rem] text-muted-foreground uppercase font-medium">Lifetime</span>
                      <span className="font-semibold text-foreground">147</span>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Right 7 cols: Predefined Panel for 5-call review list */}
            <div className="lg:col-span-7">
              <Panel
                title="Today's Birds Review"
                count={5}
                description="Re-listen to any call from this session."
                action={<StatusBadge tone="positive">4 of 5 correct</StatusBadge>}
                footer={
                  <p className="text-right text-[0.6875rem] text-muted-foreground">
                    Next daily rotation in <strong className="font-medium text-foreground">14h 22m</strong>
                  </p>
                }
                className="h-full flex flex-col justify-between"
              >
                <ul className="grid divide-y divide-border/60">
                  {SAMPLE_SUMMARY_BIRDS.map((item, idx) => (
                    <li key={item.scientific} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          aria-label={`Play recording for ${item.name}`}
                          className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <SpeakerHighIcon className="size-3.5" />
                        </button>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">
                            <span className="font-mono text-muted-foreground mr-1 tabular-nums">#{idx + 1}</span>
                            {item.name}
                          </p>
                          <p className="truncate font-serif text-[0.6875rem] italic text-muted-foreground">
                            {item.scientific}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden font-mono text-[0.6875rem] tabular-nums text-muted-foreground sm:inline">
                          {item.duration}
                        </span>
                        <StatusBadge tone={item.correct ? "positive" : "negative"} className="gap-1 text-[0.6875rem]">
                          {item.correct ? <CheckIcon className="size-3" weight="bold" /> : <XIcon className="size-3" weight="bold" />}
                          {item.correct ? "Target" : "Missed"}
                        </StatusBadge>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </>
        ) : null}
      </div>

      {/* Persistent Metadata Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-3 py-2 text-[0.625rem] text-muted-foreground">
        <span>
          Xeno-canto #{question.xcId || "XC842190"} · Recorded by {question.recordist || "Philippe J. Dubois"}
        </span>
        <span>License: {question.license || "Creative Commons (BY-NC-SA 4.0)"}</span>
      </div>
    </div>
  );
}
