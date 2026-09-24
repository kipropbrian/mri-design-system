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
 * - **Between sections** `gap-6` — the 24px of "24 / 24 / 12" in the section
 *   rhythm. Sections space themselves; `space-y-*` here is drift.
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
        // `grid-cols-[minmax(0,1fr)]` is load-bearing, not decoration. A grid's implicit
        // column is `auto`, whose minimum is the largest child's **min-content** width —
        // so one child that cannot wrap drags the column, and with it every sibling.
        // Measured on `/gbif`: an unwrappable dataset title gave one child a 688px
        // min-content, which stretched the page header to 688px inside a 320px viewport
        // and silently clipped the h1. An explicit `minmax(0,1fr)` column means a child
        // that will not shrink overflows *itself* — where it can be seen and fixed —
        // instead of the page.
        "mx-auto grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] px-4 sm:px-6 lg:px-8",
        density === "page" ? "gap-6 py-6 lg:py-10" : "py-3",
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
  divider = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        divider && "border-b border-border/60 pb-3",
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

/* -------------------------------------------------------------------- prose */

/**
 * A document: a policy, a licence list, an about page.
 *
 * This is the one text composition the system was missing, and its absence showed:
 * the platform's `/privacy`, `/terms`, `/licences`, `/legal` and `/contact` routes all
 * rendered through a hand-written `LegalPage` in `components/legal/`, which restated
 * `PageContainer`'s padding (`px-4 py-10 sm:py-10 lg:py-10`), reinvented the page
 * title at `text-3xl font-semibold tracking-tight`, added its own uppercase eyebrow,
 * and styled every paragraph through a single `[&_p]:text-sm [&_p]:leading-7`
 * descendant selector. Five routes inheriting one route-level opinion is the drift
 * this system exists to prevent, and it was invisible to the audit because none of it
 * broke a class-string rule — it broke the composition rule instead.
 *
 * ## Reading is not the same as interface
 *
 * The type scale's body size is `text-xs` (12px), and that is right for a table or a
 * card: dense, scannable, compared in rows. A document is not scanned, it is read, so
 * `Prose` sets its body at `text-sm/relaxed` (14px with generous leading), keeps
 * paragraphs under a measure of roughly 70 characters, and reserves `text-base` for a
 * section heading. That is the one place in this system where body copy is larger than
 * `text-xs`, and it is deliberate rather than drift.
 *
 * ## Use
 *
 * ```tsx
 * <PageContainer size="reading">
 *   <PageHeader eyebrow="Maiyo Research Institute" title="Privacy policy" description={intro} />
 *   <Prose>
 *     <ProseSection title="What we collect">…</ProseSection>
 *   </Prose>
 * </PageContainer>
 * ```
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid max-w-[70ch] gap-6",
        // Headings and body, so a section written as plain JSX is still on the scale.
        "[&_h2]:font-heading [&_h2]:text-base [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-foreground",
        "[&_h3]:font-heading [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-foreground",
        // No `[&_p+p]:mt-3`. `ProseSection` is already a grid, so a paragraph margin
        // lands *on top of* the gap and makes body-to-body (20px) wider than
        // heading-to-body (8px) — the hierarchy inverted by an extra rule.
        "[&_p]:text-sm/relaxed [&_p]:text-muted-foreground",
        "[&_strong]:font-medium [&_strong]:text-foreground",
        // A link inside a document is underlined, because a colour shift alone is not
        // a link cue for a reader who cannot see the colour.
        "[&_a]:font-medium [&_a]:text-primary-ink [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-primary/40 [&_a:hover]:decoration-primary",
        "[&_ul]:ml-6 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1.5",
        "[&_ol]:ml-6 [&_ol]:grid [&_ol]:list-decimal [&_ol]:gap-1.5",
        "[&_li]:text-sm/relaxed [&_li]:text-muted-foreground",
        "[&_li]:marker:text-muted-foreground",
        // A code span is an identifier, so it is mono and does not reflow.
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.6875rem] [&_code]:text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * One titled block in a `Prose` document. The heading is a real `h2` with an `id`, so
 * a long policy can be linked into and navigated by heading.
 */
export function ProseSection({
  title,
  id,
  children,
  className,
}: {
  title: ReactNode;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-2", className)}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * The "who to ask" note that closes a policy. Informational, so it carries the `info`
 * role rather than the primary one — it is not the page's main action.
 */
export function ProseNote({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-lg bg-info/5 px-4 py-3 text-sm/relaxed text-muted-foreground ring-1 ring-info/20">
      {children}
    </aside>
  );
}
