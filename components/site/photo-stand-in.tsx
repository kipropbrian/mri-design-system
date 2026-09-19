import { cn } from "cn";

/*
 * This file is the one place in the system that names Tailwind palette colours.
 *
 * It lives here, in the review site's own chrome, rather than in the installed layer,
 * so that `components/mri/layout.tsx` stays byte-identical in every project that
 * installs it. A component that exists for a documentation page's benefit has no
 * business shipping into an application.
 */

/**
 * A stand-in for a photograph.
 *
 * The chip and overlay rules are about legibility on an **arbitrary** image, so their
 * demos need a surface that is pale, busy and out of the author's control. A real
 * photograph would do, but a review page has to render without one; a token-coloured
 * gradient would be a background rather than a picture, and the whole point is that the
 * surface fights the chip.
 *
 * This is the only place in the system that names Tailwind palette colours, and it is
 * here so nothing else has to. It is deliberately unattractive, because it is not
 * decoration and should not be reached for as any.
 */
export function PhotoStandIn({
  variant = "pale",
  className,
}: {
  /** `pale` is the worst case for an outline chip; `dark` is the worst case for dark ink. */
  variant?: "pale" | "dark";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-gradient-to-br",
        variant === "pale"
          ? "from-sky-100 via-white to-amber-100"
          : "from-slate-700 via-slate-500 to-emerald-900",
        className,
      )}
    />
  );
}
