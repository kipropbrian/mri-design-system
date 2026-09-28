"use client";

import { useState } from "react";
import {
  AvailabilityGrid,
  AvailabilityLegend,
  type AvailabilityLevel,
  type AvailabilityRow,
} from "@/components/mri/availability-grid";
import { ChoiceButton, ChoiceLink, ChoiceStrip } from "@/components/mri/choice-strip";

const AVAILABILITY_LEVELS: AvailabilityLevel[] = [
  { key: "complete", label: "Reported", className: "bg-primary" },
  { key: "partial", label: "Partial", className: "bg-info" },
];

const EMPTY_LEVEL: AvailabilityLevel = {
  key: "empty",
  label: "No report",
  className: "bg-muted",
};

const MONTHS = [
  "2025-01",
  "2025-02",
  "2025-03",
  "2025-04",
  "2025-05",
  "2025-06",
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
];

function cells(from: string, partial: string[] = [], empty: string[] = []) {
  return Object.fromEntries(
    MONTHS.filter((month) => month >= from && !empty.includes(month)).map((month) => [
      month,
      partial.includes(month) ? "partial" : "complete",
    ]),
  );
}

const AVAILABILITY_ROWS: AvailabilityRow[] = [
  {
    key: "kgl",
    label: "Kigali urban station",
    detail: "RW001",
    from: "2025-01",
    cells: cells("2025-01", ["2025-04", "2026-02"], ["2025-08"]),
    describe: (month) => <>Kigali urban station · {month}</>,
  },
  {
    key: "musanze",
    label: "Musanze foothills",
    detail: "RW014",
    from: "2025-05",
    cells: cells("2025-05", ["2025-11", "2026-05"], ["2026-08", "2026-09"]),
    describe: (month) => <>Musanze foothills · {month}</>,
  },
  {
    key: "nyungwe",
    label: "Nyungwe canopy recorder",
    detail: "RW021",
    from: "2025-10",
    cells: cells("2025-10", ["2026-01", "2026-07"]),
    describe: (month) => <>Nyungwe canopy recorder · {month}</>,
  },
  {
    key: "akagera",
    label: "Akagera wetland site",
    detail: "RW033",
    from: "2026-03",
    cells: cells("2026-03", ["2026-04"], ["2026-09"]),
    describe: (month) => <>Akagera wetland site · {month}</>,
  },
];

export function ChoiceStripDemo() {
  const [period, setPeriod] = useState("month");

  return (
    <div className="grid gap-4">
      <ChoiceStrip label="Country" kind="nav" band>
        <ChoiceLink href="#choice-strip" active>
          <span className="font-mono text-[0.6875rem] font-medium">RW</span>
          Rwanda
        </ChoiceLink>
        <ChoiceLink href="#choice-strip" active={false}>
          <span className="font-mono text-[0.6875rem] font-medium">KE</span>
          Kenya
        </ChoiceLink>
        <ChoiceLink href="#choice-strip" active={false}>
          <span className="font-mono text-[0.6875rem] font-medium">UG</span>
          Uganda
        </ChoiceLink>
      </ChoiceStrip>

      <ChoiceStrip label="Reporting period">
        {[
          ["week", "Week"],
          ["month", "Month"],
          ["year", "Year"],
        ].map(([value, label]) => (
          <ChoiceButton key={value} active={period === value} onClick={() => setPeriod(value)}>
            {label}
          </ChoiceButton>
        ))}
      </ChoiceStrip>
    </div>
  );
}

export function AvailabilityGridDemo() {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-4 text-[0.6875rem] text-muted-foreground">
        <AvailabilityLegend levels={[...AVAILABILITY_LEVELS, EMPTY_LEVEL]} />
      </div>
      <AvailabilityGrid
        months={MONTHS}
        rows={AVAILABILITY_ROWS}
        levels={AVAILABILITY_LEVELS}
        emptyLevel={EMPTY_LEVEL}
      />
    </div>
  );
}
