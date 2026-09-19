import type { ReactNode } from "react";
import { cn } from "cn";

/**
 * Page-level layout primitives.
 *
 * These are the only additions on top of the preset at the *layout* layer: a
 * width-constrained container and a page/section header. Everything they render
 * uses semantic tokens and the preset's own type scale — no bespoke CSS, no new
 * global variables.
 */

const WIDTHS = {
  wide: "max-w-7xl",
  default: "max-w-6xl",
  reading: "max-w-3xl",
} as const;

/**
 * The page container, and the **only** thing that decides page padding.
 *
 * ## The contract
 *
 * It is a grid with a gutter, so a route lists its sections as children and never
 * spaces them itself. Three numbers, and no route chooses its own:
 *
 * - **Horizontal** `px-4 sm:px-6 lg:px-8` — the shell gutter, 16 / 24 / 32px.
 * - **Vertical** `py-6 lg:py-10` — 24px, then 40px from `lg`.
 * - **Between sections** `gap-10` — the 40px of "40px between sections" in the
 *   spacing scale. Sections space themselves; `space-y-*` here is drift.
 *
 * ## Why it is written this way
 *
 * Padding used to be inherited rather than decided, and nothing supplied a top
 * padding at all: the page shell drew a card with `border` and no padding, the
 * container supplied `px` and whatever `pb` the route happened to pass, and so
 * content began at **0px** from the top edge while the bottom ended at 40px.
 * Twenty-four files had grown **seven different padding recipes** between them.
 *
 * A route that needs different padding does not have a padding requirement; it has
 * a layout requirement that this container is not expressing yet. Change the
 * contract here, in one place, or use `size`.
 */
export function PageContainer({
  size = "wide",
  density = "page",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  size?: keyof typeof WIDTHS;
  /**
   * `page` is a route's content. `band` is a horizontal strip that shares the
   * page's gutter and width but not its rhythm — a section nav, a sticky filter
   * bar. A band is not a page with different padding, which is why it is a value
   * here rather than `className="py-3"` at the call site.
   */
  density?: "page" | "band";
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full min-w-0 max-w-full px-4 sm:px-6 lg:px-8",
        density === "page" ? "gap-10 py-6 lg:py-10" : "py-3",
        WIDTHS[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p
      className={cn(
        "text-[0.625rem] font-medium uppercase tracking-[0.14em] text-primary-ink",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  status,
  actions,
  className,
  titleTag = "h1",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /**
   * Set to `"div"` in a loading skeleton. A skeleton must not emit an `<h1>`,
   * or the real header that replaces it produces a second one and the document
   * ends up with two top-level headings.
   */
  titleTag?: "h1" | "div";
}) {
  const titleClassName =
    "text-balance font-heading text-2xl font-medium tracking-tight text-foreground sm:text-3xl";

  return (
    <header
      className={cn(
        "grid gap-4 border-b border-border/60 pb-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow> : null}
        {titleTag === "h1" ? (
          <h1 className={titleClassName}>{title}</h1>
        ) : (
          <div aria-hidden="true" className={titleClassName}>
            {title}
          </div>
        )}
        {description ? (
          <p className="mt-2 max-w-3xl text-pretty text-xs/relaxed text-muted-foreground sm:text-sm/relaxed">
            {description}
          </p>
        ) : null}
        {status ? <div className="mt-3 flex flex-wrap items-center gap-1.5">{status}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-1.5">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  id,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-3",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-1">{eyebrow}</Eyebrow> : null}
        <h2
          id={id}
          className="font-heading text-base font-medium tracking-tight text-foreground sm:text-lg"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-xs/relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-1.5">{action}</div> : null}
    </div>
  );
}

/** Numbered annotation used beside a specimen of a pattern. */
export function SpecimenLabel({
  index,
  title,
  description,
  className,
}: {
  index: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-start gap-3", className)}>
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[0.625rem] font-medium text-primary-ink">
        {index}
      </span>
      <div className="min-w-0">
        <p className="font-heading text-xs/relaxed font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A labelled demo region. Every pattern on the review site is wrapped in one of
 * these so the chrome around the specimen never gets confused with the specimen.
 */
export function Specimen({
  label,
  note,
  children,
  className,
  contentClassName,
}: {
  label: ReactNode;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("grid gap-2", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        {note ? <p className="text-[0.6875rem] text-muted-foreground">{note}</p> : null}
      </div>
      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </section>
  );
}

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
