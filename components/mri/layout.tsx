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

export function PageContainer({
  size = "wide",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { size?: keyof typeof WIDTHS }) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 max-w-full px-4 sm:px-6 lg:px-8",
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
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "grid gap-4 border-b border-border/60 pb-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow> : null}
        <h1 className="text-balance font-heading text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
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
