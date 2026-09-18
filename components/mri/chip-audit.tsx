"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { Chip } from "@/components/mri/chips";

/**
 * Self-audit for the chip system.
 *
 * Rather than *claiming* every chip is one of two sizes, this measures the real
 * DOM and reports what it finds. Allowed: 20px in the page flow, 22px on a
 * photograph. Anything else is a drift and is listed by height, font size and
 * sample text so it can be found and fixed.
 */
const ALLOWED = new Map<number, string>([
  [20, "flow chip"],
  [22, "overlay chip"],
]);

interface Found {
  height: number;
  fontSize: string;
  radius: string;
  sample: string;
}

export function ChipAudit() {
  const [rows, setRows] = useState<Found[] | null>(null);

  useEffect(() => {
    const measure = () => {
      const found = new Map<string, Found>();
      for (const el of document.querySelectorAll<HTMLElement>("[data-chip]")) {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.height === 0) continue;
        const height = Math.round(rect.height);
        const key = `${height}|${cs.fontSize}|${cs.borderTopLeftRadius}`;
        if (!found.has(key)) {
          found.set(key, {
            height,
            fontSize: cs.fontSize,
            radius: cs.borderTopLeftRadius.startsWith("3")
              ? "full"
              : `${Math.round(parseFloat(cs.borderTopLeftRadius))}px`,
            sample: (el.textContent ?? "").trim().slice(0, 24) || "(icon only)",
          });
        }
      }
      setRows([...found.values()].sort((a, b) => a.height - b.height));
    };
    measure();
    const timer = window.setTimeout(measure, 600);
    return () => window.clearTimeout(timer);
  }, []);

  if (!rows) {
    return (
      <p className="text-[0.6875rem] text-muted-foreground">Measuring chips on this page…</p>
    );
  }

  const drifts = rows.filter((row) => !ALLOWED.has(row.height));

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip
          tone={drifts.length === 0 ? "positive" : "negative"}
          icon={
            drifts.length === 0 ? (
              <CheckCircleIcon weight="fill" />
            ) : (
              <WarningCircleIcon weight="fill" />
            )
          }
        >
          {drifts.length === 0
            ? `${rows.length} distinct chip size${rows.length === 1 ? "" : "s"} · all within spec`
            : `${drifts.length} chip size${drifts.length === 1 ? "" : "s"} off spec`}
        </Chip>
        <Chip tone="neutral">Allowed: 20px flow · 22px overlay</Chip>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs/relaxed">
          <thead className="border-b border-border/60 text-[0.625rem] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-2 py-2 font-medium">Height</th>
              <th className="px-2 py-2 font-medium">Text</th>
              <th className="px-2 py-2 font-medium">Radius</th>
              <th className="px-2 py-2 font-medium">Verdict</th>
              <th className="px-2 py-2 font-medium">Sample</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((row) => {
              const ok = ALLOWED.has(row.height);
              return (
                <tr key={`${row.height}-${row.fontSize}`}>
                  <td className="px-2 py-2 font-mono tabular-nums text-foreground">{row.height}px</td>
                  <td className="px-2 py-2 font-mono tabular-nums text-muted-foreground">{row.fontSize}</td>
                  <td className="px-2 py-2 text-muted-foreground">{row.radius}</td>
                  <td className="px-2 py-2">
                    {ok ? (
                      <Chip tone="positive">{ALLOWED.get(row.height)}</Chip>
                    ) : (
                      <Chip tone="negative">drift</Chip>
                    )}
                  </td>
                  <td className="px-2 py-2 text-muted-foreground">{row.sample}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
