import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * The one chip.
 *
 * Every pill, badge, tag, status marker and overlay label in an MRI interface is
 * this component. Before this existed the platform had 28 hand-rolled chip
 * strings across five text sizes (9/10/11/12/13px) and four radii, so a reviewer
 * could not tell whether two chips meant different things or were just written
 * on different days.
 *
 * Two surfaces, one size each. Nothing else varies.
 *
 *   flow    20px tall · 10px text · 10px icons — every chip in the page flow
 *   overlay 22px tall · 11px text · 12px icons — chips on a photograph
 *
 * Seven tones: neutral, primary, positive, info, warning, notable, negative.
 * The state tones the preset does not ship (info, warning, notable) and the
 * readable `-ink` tier come from `app/mri-theme.css`, the portable MRI
 * semantic extension.
 *
 * The overlay surface exists because a chip over an image is read against
 * unknown contrast, so it earns one step of extra size *and* is required to
 * carry its own scrim (`appearance`). A chip may never be placed on a
 * photograph without one — that is what made the IUCN "LC" chip disappear.
 */

export type ChipTone =
  | "neutral"
  | "primary"
  | "positive"
  | "info"
  | "warning"
  | "notable"
  | "negative";
export type ChipAppearance = "dark" | "light" | "highlight";

const FLOW_TONES: Record<ChipTone, string> = {
  neutral: "border-border bg-input/20 text-foreground",
  /** Solid fill, so the ink is the fill's own `-foreground`. */
  primary: "border-transparent bg-primary text-primary-foreground",
  /** Tinted fill, so the ink is the readable `-ink`, never the role colour. */
  positive: "border-primary/30 bg-primary/10 text-primary-ink",
  info: "border-info/30 bg-info/10 text-info-ink",
  warning: "border-warning/40 bg-warning/10 text-warning-ink",
  notable: "border-notable/50 bg-notable/25 text-notable-ink",
  negative: "border-transparent bg-destructive/10 text-destructive-ink",
};

/**
 * Scrims for the overlay surface. Each one is opaque enough to guarantee
 * contrast against any photograph, so the chip never depends on what is behind
 * it: black/70 ⇒ ~8:1 with white, background/90 ⇒ ~15:1 with foreground, and the
 * notable gold pairs a light fill with a dark ink rather than the reverse.
 */
const OVERLAY_APPEARANCES: Record<ChipAppearance, string> = {
  dark: "border-transparent bg-black/70 text-white backdrop-blur-md",
  light: "border-transparent bg-background/90 text-foreground backdrop-blur-md",
  /** For "this is rarer than rare" — the rarity accent, on the image itself. */
  highlight: "border-transparent bg-notable/95 text-notable-foreground backdrop-blur-md",
};

/**
 * Why this is a `<span>` and not the preset `Badge`.
 *
 * `Badge`'s variants carry `dark:bg-input/30`. Tailwind compiles `dark:` with
 * `:is(.dark *)`, which adds a class of specificity, so a dark variant always
 * beats a base utility — and tailwind-merge will not remove it either, because a
 * `dark:` utility and a base utility are different conflict groups. The result:
 * any chip colour you pass is silently replaced by a grey tint in dark mode.
 *
 * Neutralising it with `dark:bg-transparent` is worse, not better: that also
 * wins on specificity and erases the background in *both* modes.
 *
 * So Chip owns its own class string — the same geometry, tokens and ring-based
 * treatment the preset Badge uses — and the preset `Badge` stays untouched for
 * anywhere the default look is actually wanted (`/components` demonstrates it).
 */
const CHIP_BASE =
  "inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-full border whitespace-nowrap transition-colors select-none";

const FLOW_CLASS = cn(CHIP_BASE, "h-5 gap-1 px-2 text-[0.625rem] font-medium [&>svg]:size-2.5!");
const OVERLAY_CLASS = cn(
  CHIP_BASE,
  "h-5.5 gap-1.5 px-2 text-[0.6875rem] font-medium shadow-xs [&>svg]:size-3!",
);

type FlowChipProps = {
  surface?: "flow";
  tone?: ChipTone;
  appearance?: never;
};

type OverlayChipProps = {
  surface: "overlay";
  appearance: ChipAppearance;
  tone?: never;
};

export type ChipProps = (FlowChipProps | OverlayChipProps) & {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
};

export function Chip(props: ChipProps) {
  const { icon, children, className, title } = props;
  const isOverlay = props.surface === "overlay";

  return (
    <span
      data-chip={isOverlay ? "overlay" : "flow"}
      title={title}
      className={cn(
        isOverlay ? OVERLAY_CLASS : FLOW_CLASS,
        isOverlay ? OVERLAY_APPEARANCES[props.appearance] : FLOW_TONES[props.tone ?? "neutral"],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * A row of chips. Fixed 6px gap so chip rows line up across every card, and a
 * hard cap of two on the overlay surface — a third chip means the image is
 * carrying data that belongs in the card body.
 */
export function ChipRow({
  children,
  surface = "flow",
  className,
}: {
  children: ReactNode;
  surface?: "flow" | "overlay";
  className?: string;
}) {
  const count = Array.isArray(children) ? children.flat().filter(Boolean).length : 1;
  if (surface === "overlay" && count > 2 && process.env.NODE_ENV !== "production") {
    console.warn(
      `ChipRow(overlay) received ${count} chips. At most two chips may sit on a photograph; move the rest into the card body.`,
    );
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>{children}</div>
  );
}

/**
 * Caption strip for a photograph. Always a bottom gradient, never bare text on
 * an image, with a fixed 32px minimum height so attribution stays legible over a
 * bright sky as well as a dark understory.
 */
export function OverlayCaption({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 pt-10 pb-2",
        className,
      )}
    >
      <p className="truncate text-[0.625rem] text-white/85">{children}</p>
    </div>
  );
}
