"use client";

import { useId } from "react";
import { ArrowCounterClockwise, Pause, Play, SpeakerHigh } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { cn } from "cn";

/**
 * The audio player.
 *
 * Audio is not a peripheral concern for this institute — birdsong is the subject,
 * not the illustration — so this is a first-class pattern with rules rather than a
 * control each route assembles. It is built from the quiz screen's player, which
 * was the one implementation already on tokens and the one that read correctly.
 *
 * ## The rules
 *
 * 1. **The player owns transport; the caller owns playback.** This component takes
 *    `isPlaying`, `currentTime` and `duration` and reports intent through
 *    `onTogglePlay`, `onReplay` and `onSeek`. It never holds an `<audio>` element,
 *    because the element's lifetime has to outlive the player — a re-render must
 *    not restart a recording, and the same element usually drives the waveform, the
 *    spectrogram and the media session key.
 * 2. **Seek is a fraction, not a time.** `onSeek` reports 0–1 from the track's own
 *    geometry, so the caller converts against the duration it already owns and the
 *    player never has to know how long the recording is to stay correct.
 * 3. **The time is tabular.** Position and duration sit in mono with
 *    `tabular-nums` so the label does not shimmy as the digits change, and the
 *    duration shows a placeholder until it is known rather than `0:00`.
 * 4. **On a photograph the player takes `surface="overlay"`.** The default card
 *    surface is a themed panel; an overlay is scrimmed so it stays legible on
 *    arbitrary artwork, the same rule the chips follow.
 * 5. **The transport is keyboard-first.** Play/pause is space, replay is R, both
 *    advertised in the UI with `kbd`, and neither is bound here — the shortcut
 *    belongs to the screen that owns focus.
 */
export interface AudioPlayerProps {
  isPlaying: boolean;
  /** Elapsed seconds. */
  currentTime: number;
  /** Total seconds, or 0 while unknown. */
  duration: number;
  onTogglePlay: () => void;
  onReplay: () => void;
  /** Position as a fraction of the track, 0–1. */
  onSeek: (position: number) => void;
  /** Names the recording, for the control's accessible names. */
  label?: string;
  /** Disables the controls — an autoplay policy not yet satisfied, or no source. */
  disabled?: boolean;
  /** `card` is a themed panel; `overlay` is scrimmed for use on artwork. */
  surface?: "card" | "overlay";
  /** Real waveform peaks, 0–1. Omit for the decorative bar pattern. */
  peaks?: readonly number[];
  className?: string;
}

/**
 * A decorative bar pattern, used when no real peaks are supplied.
 *
 * Deliberately irregular: an even pattern reads as a loading state rather than as
 * audio. It carries no information, so it is `aria-hidden` and the progress bar
 * below is the only thing describing position.
 */
const DECORATIVE_PEAKS = [
  0.33, 0.61, 0.44, 0.78, 1, 0.67, 0.5, 0.83, 0.61, 0.39, 0.72, 0.89, 0.56, 0.42, 0.78, 0.56,
];

export function AudioPlayer({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onReplay,
  onSeek,
  label,
  disabled = false,
  surface = "card",
  peaks,
  className,
}: AudioPlayerProps) {
  const progressId = useId();
  const bars = peaks?.length ? peaks : DECORATIVE_PEAKS;
  const known = Number.isFinite(duration) && duration > 0;
  const progress = known ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const name = label ? `“${label}”` : "the recording";
  const overlay = surface === "overlay";

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    onSeek(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
  };

  return (
    <div
      className={cn(
        "grid gap-3 rounded-xl p-4",
        overlay
          ? "bg-foreground/70 text-background backdrop-blur-sm"
          : "border border-border bg-card shadow-xs",
        className,
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={isPlaying ? `Pause ${name} (Space)` : `Play ${name} (Space)`}
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full transition-transform",
            "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50",
            overlay
              ? "bg-background text-foreground focus-visible:ring-background focus-visible:ring-offset-foreground/70"
              : "bg-primary text-primary-foreground focus-visible:ring-ring hover:bg-primary/90",
          )}
        >
          {isPlaying ? (
            <Pause className="size-5 fill-current" aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
          )}
        </button>

        <div
          className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden px-2"
          aria-hidden="true"
        >
          {bars.map((peak, index) => {
            const passed = progress >= index / bars.length;
            return (
              <span
                key={index}
                className={cn(
                  "w-1 rounded-full transition-all duration-150",
                  passed
                    ? overlay
                      ? "bg-background"
                      : "bg-primary"
                    : overlay
                      ? "bg-background/35"
                      : "bg-muted-foreground/30",
                  isPlaying && "animate-pulse motion-reduce:animate-none",
                )}
                style={{
                  height: `${Math.round(Math.min(1, Math.max(0.15, peak)) * 36 + 4)}px`,
                  animationDelay: `${(index % 4) * 120}ms`,
                }}
              />
            );
          })}
        </div>

        <Button
          type="button"
          variant={overlay ? "secondary" : "outline"}
          size="sm"
          onClick={onReplay}
          disabled={disabled}
          title="Replay from the beginning (R)"
          className="h-9 gap-1.5 px-3 text-xs"
        >
          <ArrowCounterClockwise className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Replay</span>
          <kbd className="hidden rounded bg-muted px-1 font-mono text-[0.625rem] text-muted-foreground sm:inline">
            R
          </kbd>
        </Button>
      </div>

      <div className="grid gap-1.5">
        <div
          id={progressId}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Playback progress for ${name}`}
          onClick={handleTrackClick}
          className="group relative h-3 cursor-pointer py-1"
        >
          <div
            className={cn(
              "h-1.5 w-full overflow-hidden rounded-full transition-all group-hover:h-2",
              overlay ? "bg-background/30" : "bg-muted",
            )}
          >
            <div
              className={cn("h-full rounded-full", overlay ? "bg-background" : "bg-primary")}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between font-mono text-xs tabular-nums",
            overlay ? "text-background/80" : "text-muted-foreground",
          )}
        >
          <span className="flex items-center gap-1">
            <SpeakerHigh
              className={cn("size-3", overlay ? "text-background" : "text-primary")}
              aria-hidden="true"
            />
            {formatDuration(currentTime)}
          </span>
          <span>{known ? formatDuration(duration) : "—:——"}</span>
        </div>
      </div>
    </div>
  );
}
