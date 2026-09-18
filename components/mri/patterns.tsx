import type { ReactNode } from "react";
import { cn } from "cn";
import {
  ArrowUpIcon,
  CaretRightIcon,
  ChartLineUpIcon,
  CircleNotchIcon,
  ClockCounterClockwiseIcon,
  DatabaseIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Chip, type ChipTone } from "@/components/mri/chips";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Higher-level page compositions.
 *
 * Each one is a thin arrangement of preset primitives — no new tokens, no
 * global CSS, no bespoke variants on the shadcn components themselves.
 */

/* ------------------------------------------------------------------- panels */

export function Panel({
  title,
  description,
  action,
  footer,
  children,
  className,
  contentClassName,
  size = "default",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  size?: "default" | "sm";
}) {
  return (
    <Card size={size} className={cn("min-w-0", className)}>
      {title || description || action ? (
        <CardHeader className="border-b border-border/60 pb-3">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
          {action ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("min-w-0", contentClassName)}>{children}</CardContent>
      {footer ? (
        <div className="border-t border-border/60 px-(--card-spacing) pt-3 text-xs/relaxed text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

/* ------------------------------------------------------------------ metrics */

export type TrendTone = "positive" | "negative" | "neutral";

export function Trend({ value, tone = "neutral" }: { value: ReactNode; tone?: TrendTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[0.6875rem] tabular-nums",
        tone === "positive" && "text-primary-ink",
        tone === "negative" && "text-destructive",
        tone === "neutral" && "text-muted-foreground",
      )}
    >
      {tone === "positive" ? <ArrowUpIcon className="size-2.5" /> : null}
      {value}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  trend,
  icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  trend?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("justify-between gap-3", className)}>
      <CardHeader className="gap-1">
        <CardDescription className="flex items-center gap-1.5 text-[0.625rem] font-medium uppercase tracking-[0.12em]">
          {icon}
          <span className="truncate">{label}</span>
        </CardDescription>
        <CardTitle className="truncate text-xl font-medium tabular-nums text-foreground">
          {value}
        </CardTitle>
      </CardHeader>
      {detail || trend ? (
        <CardContent className="flex items-center justify-between gap-2">
          {detail ? <span className="truncate text-[0.6875rem] text-muted-foreground">{detail}</span> : <span />}
          {trend ?? null}
        </CardContent>
      ) : null}
    </Card>
  );
}

export function MetricStrip({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  return (
    <section
      aria-label={label ?? "Summary metrics"}
      className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------- badges */

export type StatusTone = ChipTone;

/**
 * A status chip. Kept as a named alias so route code reads as intent
 * ("this is a status") while the rendering is the single shared Chip.
 */
export function StatusBadge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Chip tone={tone} icon={icon} className={className}>
      {children}
    </Chip>
  );
}

/* ---------------------------------------------------------- filter sidebar */

export interface FilterGroup {
  legend: string;
  options: { label: string; count?: number; checked?: boolean }[];
}

/**
 * Persistent desktop filter sidebar.
 *
 * The counterpart to the filter ribbon, and the pattern an earlier MRI prototype
 * shipped but this template had lost. `/metadata` and `/inaturalist/country-firsts`
 * use sidebars today, so the master needs to own the shape rather than leave each
 * route to invent it.
 *
 * Pair it with content at `lg:grid-cols-[minmax(0,1fr)_18rem]`. Widths are 18rem
 * (288px) or less; a sidebar wider than the content it filters is a layout smell.
 * On mobile the same groups collapse into a `Sheet`, not into this component.
 *
 * Group legends are sentence-case `font-medium`, **not** uppercase eyebrows —
 * the same rule that governs data-card headers.
 */
export function FilterSidebar({
  title,
  description,
  groups,
  count,
  footer,
  className,
}: {
  title: string;
  description?: string;
  groups: FilterGroup[];
  count?: number;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <aside
      aria-label={title}
      className={cn(
        "grid w-full content-start overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10 lg:w-72",
        className,
      )}
    >
      {/* Data-card header standard: title carries its count, one-line description,
          fixed 48px minimum so sidebars align with adjacent panels. */}
      <header className="flex min-h-[48px] flex-col justify-center gap-0.5 border-b border-border/60 px-3 py-3">
        <h3 className="truncate text-sm font-medium tracking-tight text-foreground">
          {title}
          {count !== undefined ? ` (${count})` : ""}
        </h3>
        {description ? (
          <p className="truncate text-[0.6875rem] text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <div className="grid divide-y divide-border/60">
        {groups.map((group) => (
          <fieldset key={group.legend} className="grid gap-2 px-3 py-3">
            <legend className="text-[0.6875rem] font-medium text-foreground">{group.legend}</legend>
            {group.options.map((option) => (
              <label
                key={option.label}
                className="flex cursor-pointer items-center gap-2 text-xs/relaxed"
              >
                <Checkbox defaultChecked={option.checked} />
                <span className="min-w-0 flex-1 truncate text-foreground">{option.label}</span>
                {option.count !== undefined ? (
                  <span className="shrink-0 tabular-nums text-muted-foreground">{option.count}</span>
                ) : null}
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      {footer ? (
        <div className="border-t border-border/60 px-3 py-3 text-[0.6875rem] text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

/* ----------------------------------------------------------- status history */

export interface StatusStep {
  label: string;
  tone?: ChipTone;
}

/**
 * Previous → current status, as chips.
 *
 * A verification state is not just "stable" — a reviewer needs to see what it
 * changed *from*. The live platform already carries this
 * (`latestChange.previous_status` → `status`) and an earlier prototype rendered it
 * as `.status-path`; this is that pattern, on the shared chip.
 */
export function StatusPath({
  steps,
  className,
  label = "Status history",
}: {
  steps: StatusStep[];
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label={label}>
      {steps.map((step, index) => (
        <span key={`${step.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? (
            <CaretRightIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : null}
          <Chip tone={step.tone ?? "neutral"}>{step.label}</Chip>
        </span>
      ))}
    </div>
  );
}

/**
 * A record whose evidence changed since it was first seen. Warning-toned because
 * it needs a human decision, not because anything failed.
 */
export function RecordChange({
  title,
  description,
  steps,
  timestamp,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  steps: StatusStep[];
  timestamp?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg bg-warning/10 p-3 ring-1 ring-warning/25",
        className,
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-warning/20 text-warning-ink">
        <ClockCounterClockwiseIcon className="size-4" />
      </span>
      <div className="grid min-w-0 gap-2">
        <div className="grid gap-0.5">
          <p className="text-xs/relaxed font-medium text-foreground">{title}</p>
          {description ? (
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <StatusPath steps={steps} />
        {timestamp ? <p className="text-[0.625rem] text-muted-foreground">{timestamp}</p> : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- space */

/**
 * The gutter for a grid of cards. One value, everywhere: 12px.
 * `gap-3` between cards is the single most common spacing drift, so it is
 * not available here.
 */
export function CardGrid({
  children,
  className,
  columns = "sm:grid-cols-2 lg:grid-cols-3",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  columns?: string;
  as?: "div" | "section";
}) {
  return <Tag className={cn("grid gap-3", columns, className)}>{children}</Tag>;
}

/**
 * Vertical rhythm between blocks on a page.
 *
 *   section 40px — between distinct questions
 *   block   24px — between a heading and its content
 *   tight   12px — inside a block
 */
export function Stack({
  children,
  className,
  gap = "section",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  gap?: "section" | "block" | "tight";
  as?: "div" | "section";
}) {
  const gaps = { section: "gap-10", block: "gap-6", tight: "gap-3" } as const;
  return <Tag className={cn("grid", gaps[gap], className)}>{children}</Tag>;
}

/* --------------------------------------------------------------- data states */

export function LoadingState({ title = "Loading…", description }: { title?: ReactNode; description?: ReactNode }) {
  return (
    <DataState
      icon={<CircleNotchIcon className="animate-spin" />}
      title={title}
      description={description}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return <DataState icon={<DatabaseIcon />} title={title} description={description} action={action} />;
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <DataState
      icon={<WarningCircleIcon />}
      title={title}
      description={description}
      action={action}
      tone="negative"
    />
  );
}

function DataState({
  icon,
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "negative";
}) {
  return (
    <Empty
      className={cn(
        "border border-dashed border-border bg-muted/20",
        tone === "negative" && "border-destructive/40 bg-destructive/5",
      )}
    >
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className={cn("text-primary-ink", tone === "negative" && "bg-destructive/10 text-destructive")}
        >
          {icon}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

/* ---------------------------------------------------------------- skeletons */

export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <Card size="sm" className={cn("justify-between gap-3", className)} aria-hidden="true">
      <CardHeader className="gap-2">
        <Skeleton className="h-2.5 w-24 rounded" />
        <Skeleton className="h-6 w-20 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-2.5 w-28 rounded" />
      </CardContent>
    </Card>
  );
}

export function MetricStripSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section
      className="grid grid-cols-2 gap-3 sm:gap-3 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading summary metrics"
    >
      {Array.from({ length: count }, (_, index) => (
        <MetricCardSkeleton key={index} />
      ))}
    </section>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
  label = "Loading table",
  className,
}: {
  rows?: number;
  columns?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10", className)}
      aria-busy="true"
      aria-label={label}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs/relaxed">
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} className="px-3 py-2">
                  <Skeleton className="h-2.5 w-16 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: columns }, (_, index) => (
                  <td key={index} className="px-3 py-3">
                    <Skeleton
                      className="h-3 rounded"
                      style={{ width: `${45 + ((row + index) % 4) * 12}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- chrome */

export function ChartFrame({
  title,
  description,
  action,
  legend,
  footnote,
  children,
  className,
  ariaLabel,
  height = "h-64",
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  legend?: ReactNode;
  footnote?: ReactNode;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  height?: string;
}) {
  return (
    <Panel
      title={title}
      description={description}
      action={action}
      className={className}
      contentClassName="grid gap-3"
      footer={footnote}
    >
      {legend ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.6875rem] text-muted-foreground">
          {legend}
        </div>
      ) : null}
      <div className={cn("min-w-0 w-full", height)} role="img" aria-label={ariaLabel}>
        {children}
      </div>
    </Panel>
  );
}

export function LegendSwatch({ color, label }: { color: string; label: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function SourceNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[0.6875rem] text-muted-foreground", className)}>
      <ChartLineUpIcon className="mr-1 inline size-3 align-[-1px]" aria-hidden="true" />
      {children}
    </p>
  );
}
