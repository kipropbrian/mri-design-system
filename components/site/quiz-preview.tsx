"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  FireIcon,
  HeadphonesIcon,
  KeyboardIcon,
  PauseIcon,
  PlayIcon,
  QuestionIcon,
  SpeakerHighIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Chip, ChipRow, OverlayCaption } from "@/components/mri/chips";
import { cn } from "cn";

/**
 * Bird sound quiz, reduced to one interactive call.
 *
 * There is no audio file in the design system, so playback is simulated: the
 * waveform and scrubber animate on a timer. Every layout, colour and state
 * treatment is the real one, so the review is about the interface, not the
 * media runtime.
 */

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
}

const KEY_LABELS = ["A", "B", "C", "D"] as const;
const WAVE_BARS = [
  0.3, 0.55, 0.85, 0.45, 0.7, 1, 0.6, 0.35, 0.8, 0.5, 0.95, 0.65, 0.4, 0.75, 0.55, 0.25,
] as const;
const SIMULATED_SECONDS = 18;

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

  return { isPlaying, elapsed, toggle, seek };
}

function formatClock(seconds: number) {
  const whole = Math.floor(seconds);
  const mm = Math.floor(whole / 60);
  const ss = String(whole % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function AudioPlayerMock({
  isPlaying,
  elapsed,
  onToggle,
  onSeek,
}: {
  isPlaying: boolean;
  elapsed: number;
  onToggle: () => void;
  onSeek: (fraction: number) => void;
}) {
  const progress = elapsed / SIMULATED_SECONDS;

  return (
    <div className="grid gap-3 rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isPlaying ? "Pause recording" : "Play recording"}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
        >
          {isPlaying ? <PauseIcon className="size-4" weight="fill" /> : <PlayIcon className="size-4" weight="fill" />}
        </button>

        <div className="flex min-w-0 flex-1 items-end gap-[3px]" aria-hidden="true">
          {WAVE_BARS.map((height, index) => {
            const played = index / WAVE_BARS.length <= progress;
            return (
              <span
                key={index}
                style={{ height: `${Math.round(height * 26) + 4}px` }}
                className={cn(
                  "w-full rounded-full transition-colors duration-150",
                  played ? "bg-primary" : "bg-muted-foreground/25",
                  isPlaying && played && "animate-pulse",
                )}
              />
            );
          })}
        </div>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Recording position"
        aria-valuemin={0}
        aria-valuemax={SIMULATED_SECONDS}
        aria-valuenow={Math.round(elapsed)}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onSeek(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") onSeek(Math.min(1, progress + 0.05));
          if (event.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.05));
        }}
        className="group h-3 cursor-pointer py-1"
      >
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted transition-all group-hover:h-2">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-[0.6875rem] tabular-nums text-muted-foreground">
        <span>{formatClock(elapsed)}</span>
        <span>{formatClock(SIMULATED_SECONDS)}</span>
      </div>
    </div>
  );
}

function ProgressChips({
  questionIndex,
  total,
  results,
}: {
  questionIndex: number;
  total: number;
  results: (boolean | null)[];
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-3">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, index) => {
          const result = results[index];
          const isActive = index === questionIndex;
          return (
            <span
              key={index}
              aria-label={`Call ${index + 1}${result === true ? " correct" : result === false ? " incorrect" : ""}`}
              className={cn(
                "grid size-7 place-items-center rounded-md text-[0.6875rem] font-medium tabular-nums transition-all",
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
        Call <strong className="font-medium text-foreground tabular-nums">{questionIndex + 1}</strong> of{" "}
        <strong className="font-medium text-foreground tabular-nums">{total}</strong>
      </span>
    </div>
  );
}

export function QuizPreview({ question }: { question: QuizQuestion }) {
  const [stage, setStage] = useState<"start" | "question" | "reveal">("start");
  const [selected, setSelected] = useState<string | null>(null);
  const { isPlaying, elapsed, toggle, seek } = useSimulatedPlayback();

  const answer = useMemo(
    () => question.options.find((option) => option.code === question.answerCode) ?? question.options[0],
    [question],
  );
  const isCorrect = selected === question.answerCode;

  const reset = () => {
    setSelected(null);
    setStage("question");
  };

  return (
    <Card className="gap-0 p-0">
      {stage === "start" ? (
        /* Media band on top, content below — the same hero-card pattern the
           landing page uses. The card's height is media + content, so there is
           no slack to distribute and no rule to break. */
        <div className="grid gap-0">
          <div className="relative aspect-[16/10] max-h-64 w-full overflow-hidden bg-muted">
            <img
              src="/quiz/forest-clearing-frame.webp"
              alt="Forest clearing at dawn, the field-recording setting for the quiz"
              className="size-full object-cover"
            />
            <OverlayCaption>Nyungwe forest, Rwanda · field recording setting</OverlayCaption>
          </div>

          <CardContent className="grid gap-3 py-(--card-spacing)">
            <ChipRow>
              <Chip tone="info" icon={<HeadphonesIcon />}>
                Field audio
              </Chip>
              <Chip tone="notable" icon={<FireIcon weight="fill" />}>
                <span className="tabular-nums">12 day streak</span>
              </Chip>
            </ChipRow>

            <div className="min-w-0">
              <h3 className="font-heading text-base font-medium tracking-tight text-foreground">
                East Africa bird sound quiz
              </h3>
              <p className="mt-1 max-w-2xl text-xs/relaxed text-muted-foreground">
                Five randomised regional recordings per session. Listen, then choose the species from four
                plausible candidates drawn from the same East African checklist.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
              <p className="text-[0.625rem] text-muted-foreground">
                One session per day · results feed your practice history
              </p>
              <Button size="lg" onClick={() => setStage("question")}>
                Start today’s set
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </div>
      ) : null}

      {stage === "question" || stage === "reveal" ? (
        <>
          <ProgressChips questionIndex={0} total={5} results={[stage === "reveal" ? isCorrect : null, null, null, null, null]} />
          <CardContent className="grid gap-4 py-(--card-spacing) lg:grid-cols-12 lg:items-start">
            <div className="grid content-start gap-4 lg:col-span-5">
              <AudioPlayerMock
                isPlaying={isPlaying}
                elapsed={elapsed}
                onToggle={toggle}
                onSeek={seek}
              />
              <div className="hidden items-start gap-2 rounded-lg bg-muted/30 p-3 text-[0.6875rem] text-muted-foreground sm:flex">
                <KeyboardIcon className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Press <Kbd>A</Kbd>–<Kbd>D</Kbd> to answer, <Kbd>Space</Kbd> to replay.{" "}
                  {question.region} · {question.recordings.toLocaleString()} recordings in scope.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:col-span-7">
              <div className="text-center">
                <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-primary-ink">
                  {stage === "reveal" ? "Result" : "Which species is calling?"}
                </p>
                <h3 className="mt-1 font-heading text-lg font-medium tracking-tight text-foreground">
                  {stage === "reveal" ? answer.commonName : "Identify the recording"}
                </h3>
              </div>

              {stage === "reveal" ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
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
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/90 via-foreground/50 to-transparent p-3 text-background">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.6875rem] font-medium backdrop-blur-md",
                        isCorrect ? "bg-primary text-primary-foreground" : "bg-destructive/90 text-background",
                      )}
                    >
                      {isCorrect ? (
                        <>
                          <CheckIcon className="size-3" weight="bold" /> Correct
                        </>
                      ) : (
                        <>
                          <XIcon className="size-3" weight="bold" /> Not quite
                        </>
                      )}
                    </span>
                    <h4 className="mt-2 font-heading text-base font-medium">{answer.commonName}</h4>
                    <p className="font-serif text-xs italic text-background/85">{answer.scientificName}</p>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {question.options.map((option, index) => {
                  const chosen = selected === option.code;
                  const correct = option.code === question.answerCode;
                  const showState = stage === "reveal";

                  return (
                    <button
                      key={option.code}
                      type="button"
                      disabled={showState}
                      onClick={() => {
                        setSelected(option.code);
                        setStage("reveal");
                      }}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg bg-background p-3 text-left ring-1 ring-foreground/10 transition-all",
                        !showState && "hover:-translate-y-0.5 hover:ring-primary/40 hover:shadow-sm",
                        chosen && !showState && "ring-primary",
                        showState && correct && "bg-primary/10 ring-primary/40",
                        showState && chosen && !correct && "bg-destructive/10 ring-destructive/40",
                        showState && !correct && !chosen && "opacity-60",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-md bg-muted font-mono text-[0.6875rem] font-medium text-muted-foreground",
                          "transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                          showState && correct && "bg-primary text-primary-foreground",
                          showState && chosen && !correct && "bg-destructive text-background",
                        )}
                      >
                        {showState && correct ? (
                          <CheckIcon className="size-3.5" weight="bold" />
                        ) : showState && chosen ? (
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
                    </button>
                  );
                })}
              </div>

              {stage === "reveal" ? (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                    <QuestionIcon className="size-3.5" />
                    Next call unlocks after this one is recorded.
                  </span>
                  <Button variant="outline" onClick={reset}>
                    <SpeakerHighIcon data-icon="inline-start" />
                    Replay and answer again
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </>
      ) : null}
    </Card>
  );
}
