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

/**
 * Skeletons mirror the geometry of the thing they stand in for, so a route does
 * not shift when the data lands (zero CLS). That is why each one takes width and
 * shape overrides: a skeleton that does not match its own table is worse than no
 * skeleton, because the shift it causes is the thing it was added to prevent.
 *
 * None of them invent a size — the widths below are the same arbitrary values
 * the real cells use.
 */

export interface MetricCardSkeletonProps {
  className?: string;
  labelWidth?: string;
  valueWidth?: string;
  detailWidth?: string;
}

export function MetricCardSkeleton({
  className,
  labelWidth = "w-24",
  valueWidth = "w-20",
  detailWidth = "w-28",
}: MetricCardSkeletonProps) {
  return (
    <Card size="sm" className={cn("justify-between gap-3", className)} aria-hidden="true">
      <CardHeader className="gap-2">
        <Skeleton className={cn("h-2.5 rounded", labelWidth)} />
        <Skeleton className={cn("h-6 rounded", valueWidth)} />
      </CardHeader>
      <CardContent>
        <Skeleton className={cn("h-2.5 rounded", detailWidth)} />
      </CardContent>
    </Card>
  );
}

/**
 * Four identical cards read as a bug rather than as a load, so the widths vary
 * by position. Deterministic, not random: the same route must skeletonise the
 * same way every time or the CLS measurement is meaningless.
 */
const METRIC_SKELETON_WIDTHS: MetricCardSkeletonProps[] = [
  { labelWidth: "w-24", valueWidth: "w-20", detailWidth: "w-28" },
  { labelWidth: "w-28", valueWidth: "w-16", detailWidth: "w-24" },
  { labelWidth: "w-20", valueWidth: "w-24", detailWidth: "w-32" },
  { labelWidth: "w-16", valueWidth: "w-14", detailWidth: "w-20" },
];

export function MetricStripSkeleton({
  count = 4,
  label = "Loading summary metrics",
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <section
      className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}
      aria-busy="true"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, index) => (
        <MetricCardSkeleton
          key={index}
          {...METRIC_SKELETON_WIDTHS[index % METRIC_SKELETON_WIDTHS.length]}
        />
      ))}
    </section>
  );
}

export interface TableColumnSkeleton {
  headerWidth?: string;
  cellWidth?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

/** Shapes for a bare column count, so `columns={5}` still looks like a table. */
const DEFAULT_COLUMN_SKELETONS: TableColumnSkeleton[] = [
  { headerWidth: "w-8", cellWidth: "w-6", align: "center" },
  { headerWidth: "w-28", cellWidth: "w-4/5" },
  { headerWidth: "w-32", cellWidth: "w-3/5" },
  { headerWidth: "w-20", cellWidth: "w-16" },
  { headerWidth: "w-24", cellWidth: "w-20" },
  { headerWidth: "w-16", cellWidth: "w-12", align: "right" },
];

/**
 * Pass `columns` as a number for a generic table, or as a column config array
 * when the skeleton has to match a specific table's real column geometry.
 * `containerClassName` styles the frame; `className` styles the `<table>`.
 */
export function TableSkeleton({
  rows = 6,
  columns = 4,
  label = "Loading table",
  className,
  containerClassName,
}: {
  rows?: number;
  columns?: number | TableColumnSkeleton[];
  label?: string;
  className?: string;
  containerClassName?: string;
}) {
  const configs: TableColumnSkeleton[] = Array.isArray(columns)
    ? columns
    : [
        ...DEFAULT_COLUMN_SKELETONS.slice(0, Math.min(columns, DEFAULT_COLUMN_SKELETONS.length)),
        ...Array.from(
          { length: Math.max(0, columns - DEFAULT_COLUMN_SKELETONS.length) },
          () => ({ headerWidth: "w-20", cellWidth: "w-24" }),
        ),
      ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10",
        containerClassName,
      )}
      aria-busy="true"
      aria-label={label}
    >
      <div className="overflow-x-auto">
        <table className={cn("w-full border-collapse text-left text-xs/relaxed", className)}>
          <thead className="border-b border-border/60 bg-muted/40">
            <tr>
              {configs.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "px-3 py-2",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    col.className,
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center",
                      col.align === "center" && "justify-center",
                      col.align === "right" && "justify-end",
                    )}
                  >
                    <Skeleton className={cn("h-2.5 rounded", col.headerWidth ?? "w-16")} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                {configs.map((col, index) => (
                  <td
                    key={index}
                    className={cn(
                      "px-3 py-3",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.className,
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center",
                        col.align === "center" && "justify-center",
                        col.align === "right" && "justify-end",
                      )}
                    >
                      <Skeleton className={cn("h-3 rounded", col.cellWidth ?? "w-3/4")} />
                    </div>
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

/**
 * The filter bar that sits above a table. It mirrors the real toolbar's
 * arrangement — search field, selects, action button, and an optional chip row —
 * because a toolbar that pops in above a table is one of the largest single
 * sources of layout shift on a data route.
 */
export function ToolbarSkeleton({
  className,
  showSelect = true,
  showChips = false,
  showFiltersButton = true,
  selectCount = 1,
  label = "Loading toolbar controls",
}: {
  className?: string;
  showSelect?: boolean;
  showChips?: boolean;
  showFiltersButton?: boolean;
  selectCount?: number;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card/95 p-2 ring-1 ring-foreground/10",
        className,
      )}
      aria-busy="true"
      aria-label={label}
    >
      <div className="relative min-w-[180px] flex-1">
        <Skeleton className="h-8 w-full rounded-md" />
      </div>

      <div className="flex shrink-0 items-center gap-2 text-xs/relaxed">
        {showSelect
          ? Array.from({ length: selectCount }, (_, index) => (
              <Skeleton key={index} className="h-8 w-32 rounded-md sm:w-36" />
            ))
          : null}

        {showFiltersButton ? <Skeleton className="h-8 w-20 rounded-md" /> : null}
      </div>

      {showChips ? (
        <div className="flex w-full items-center gap-1.5 border-t border-border/60 pt-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ) : null}
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
