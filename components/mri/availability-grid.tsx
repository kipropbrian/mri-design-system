"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "cn";

export interface AvailabilityLevel {
  key: string;
  label: string;
  className: string;
}

export interface AvailabilityRow {
  key: string;
  label: string;
  detail?: string;
  muted?: boolean;
  from: string;
  cells: Record<string, string>;
  describe: (month: string) => ReactNode;
}

type TooltipState = {
  content: ReactNode;
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
} | null;

function yearGroups(months: string[]) {
  const groups: { year: string; months: string[] }[] = [];
  for (const month of months) {
    const year = month.slice(0, 4);
    const current = groups.at(-1);
    if (current?.year === year) current.months.push(month);
    else groups.push({ year, months: [month] });
  }
  return groups;
}

/**
 * A fixed-cell availability grid modelled on data.neonscience.org's availability
 * chart. A Gantt on a linear axis crushes recent years when one row starts a decade
 * earlier; one fixed-size cell per month keeps every month legible and every label
 * visible. A blank slot means the row did not exist yet, while `emptyLevel` means it
 * existed but reported nothing. The scroll container uses `dir="rtl"` so its initial
 * position is the newest month, then its single content child restores `dir="ltr"`
 * for normal reading order without a scripted scroll jump.
 */
export function AvailabilityGrid({
  months,
  rows,
  levels,
  emptyLevel,
}: {
  months: string[];
  rows: AvailabilityRow[];
  levels: AvailabilityLevel[];
  emptyLevel: AvailabilityLevel;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tooltipShown = tooltip !== null;

  useEffect(() => {
    if (!tooltipShown) return;

    const hide = () => setTooltip(null);
    const hideOutside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !contentRef.current?.contains(event.target)) hide();
    };

    window.addEventListener("scroll", hide, { capture: true, passive: true });
    window.addEventListener("pointerdown", hideOutside);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("pointerdown", hideOutside);
    };
  }, [tooltipShown]);

  const body = useMemo(() => {
    const groups = yearGroups(months);
    const levelClasses = new Map([...levels, emptyLevel].map((level) => [level.key, level.className]));

    return (
      <>
        <div className="flex h-4 gap-0.5">
          <div className="sticky left-0 z-10 w-24 shrink-0 bg-card pr-2 sm:w-40" />
          {groups.map((group, groupIndex) => (
            <div
              key={group.year}
              className={cn(
                "relative flex shrink-0 gap-0.5",
                groupIndex > 0 && "ml-1 border-l border-dashed border-border pl-1",
              )}
            >
              <span
                className={cn(
                  "absolute inset-x-0 top-0 text-center whitespace-nowrap",
                  "text-[0.625rem] text-muted-foreground tabular-nums",
                )}
              >
                {group.year}
              </span>
              {group.months.map((month) => (
                <span key={month} className="w-2 shrink-0" />
              ))}
            </div>
          ))}
        </div>

        <div className="grid gap-0.5">
          {rows.map((row, rowIndex) => (
            <div key={row.key} className="flex h-3.5 items-center rounded-sm hover:ring-1 hover:ring-primary/40">
              <div
                className={cn(
                  "sticky left-0 z-10 flex w-24 min-w-0 shrink-0 items-center gap-1 bg-card pr-2",
                  "text-[0.6875rem] leading-3.5 sm:w-40",
                  row.muted && "text-muted-foreground",
                )}
                title={`${row.label}${row.detail ? ` ${row.detail}` : ""}`}
              >
                <span className="min-w-0 truncate">{row.label}</span>
                {row.detail ? <span className="shrink-0 text-muted-foreground">{row.detail}</span> : null}
              </div>

              {groups.map((group, groupIndex) => (
                <div
                  key={group.year}
                  className={cn(
                    "flex shrink-0 gap-0.5",
                    groupIndex > 0 && "ml-1 border-l border-dashed border-border pl-1",
                  )}
                >
                  {group.months.map((month) => {
                    if (month < row.from) {
                      return <span key={month} className="h-3 w-2 shrink-0 rounded-[2px]" />;
                    }

                    const levelKey = row.cells[month] ?? emptyLevel.key;
                    return (
                      <span
                        key={month}
                        className={cn(
                          "h-3 w-2 shrink-0 rounded-[2px]",
                          levelClasses.get(levelKey) ?? emptyLevel.className,
                        )}
                        data-row={rowIndex}
                        data-month={month}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  }, [emptyLevel, levels, months, rows]);

  const showTooltip = (event: PointerEvent<HTMLDivElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-row][data-month]");
    if (!cell) {
      setTooltip(null);
      return;
    }

    const row = rows[Number(cell.dataset.row)];
    const month = cell.dataset.month;
    if (!row || !month) return;

    setTooltip({
      content: row.describe(month),
      x: event.clientX,
      y: event.clientY,
      flipX: event.clientX > window.innerWidth - 300,
      flipY: event.clientY > window.innerHeight - 220,
    });
  };

  return (
    <div className="w-full min-w-0">
      <div dir="rtl" className="overflow-x-auto">
        <div
          ref={contentRef}
          dir="ltr"
          className="grid w-max gap-0.5"
          onPointerMove={showTooltip}
          onPointerDown={showTooltip}
          onPointerLeave={(event) => {
            if (event.pointerType !== "touch") setTooltip(null);
          }}
        >
          {body}
        </div>
      </div>

      {tooltip ? (
        <div
          className={cn(
            "pointer-events-none fixed z-50 grid max-w-72 min-w-40 gap-1 rounded-lg",
            "border border-border/50 bg-background px-2 py-1.5 text-xs/relaxed shadow-xl",
          )}
          style={{
            left: tooltip.flipX ? tooltip.x - 12 : tooltip.x + 12,
            top: tooltip.flipY ? tooltip.y - 12 : tooltip.y + 12,
            transform: `translate(${tooltip.flipX ? "-100%" : "0"}, ${tooltip.flipY ? "-100%" : "0"})`,
          }}
        >
          {tooltip.content}
        </div>
      ) : null}
    </div>
  );
}

export function AvailabilityLegend({ levels }: { levels: AvailabilityLevel[] }) {
  return (
    <>
      {levels.map((level) => (
        <span key={level.key} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 shrink-0 rounded-[2px]", level.className)} />
          {level.label}
        </span>
      ))}
    </>
  );
}
