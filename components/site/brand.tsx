import Link from "next/link";
import { cn } from "cn";

/**
 * MRI brand marks.
 *
 * The source artwork is a flat, cream-plated PNG. `scripts/prepare-assets.py`
 * knocks that plate out so the emblem can sit on any surface, and produces a
 * white knockout for dark mode. Both variants render at once and are swapped by
 * the `dark` class so no JavaScript is needed to pick the right one.
 */
export function MriMark({
  className,
  size = 32,
  alt = "",
}: {
  className?: string;
  size?: number;
  alt?: string;
}) {
  return (
    <img
      src="/brand/mri-mark.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain dark:hidden", className)}
    />
  );
}

export function MriMarkInverse({
  className,
  size = 32,
  alt = "",
}: {
  className?: string;
  size?: number;
  alt?: string;
}) {
  return (
    <img
      src="/brand/mri-mark-inverse.png"
      alt={alt}
      width={size}
      height={size}
      className={cn("hidden shrink-0 object-contain dark:block", className)}
    />
  );
}

/** Emblem + wordmark lockup, used for hero and footer treatments. */
export function MriLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/brand/mri-logo.png"
        alt="Maiyo Research Institute"
        width={758}
        height={513}
        className="h-20 w-auto object-contain dark:hidden"
      />
      <img
        src="/brand/mri-logo-inverse.png"
        alt=""
        aria-hidden="true"
        width={758}
        height={513}
        className="hidden h-20 w-auto object-contain dark:block"
      />
    </span>
  );
}

/**
 * Provider credit marks. Kept at a constant optical size and desaturated in
 * dark mode so a row of them reads as one band rather than four logos.
 */
export function ProviderMark({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={20}
      height={20}
      className={cn(
        "size-5 shrink-0 object-contain opacity-90 dark:opacity-80 dark:brightness-110",
        className,
      )}
    />
  );
}

export function BrandLink({ href = "/", subtitle = "Design system" }) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted/60 transition-transform group-hover:-rotate-3">
        <MriMark size={26} />
        <MriMarkInverse size={26} />
      </span>
      <span className="grid min-w-0 leading-tight">
        <span className="truncate font-heading text-sm font-medium text-foreground">
          MRI Platform
        </span>
        <span className="truncate text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
