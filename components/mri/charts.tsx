"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/**
 * Chart compositions.
 *
 * The preset sets `chartColor: olive`, so `--chart-1 … --chart-5` are a single
 * monochrome olive ramp (light → dark) rather than five hues. These panels lean
 * into that: at most three series per chart, ordered darkest-first, with a
 * manual legend and direct value labels instead of colour-only encoding.
 *
 * Series read `var(--color-<key>)`, which `ChartContainer` injects from
 * `config[key].color` — the documented shadcn chart contract.
 */

const AXIS_TICK = { fontSize: 10 } as const;
const GRID = { stroke: "var(--border)", strokeDasharray: "3 3", vertical: false } as const;

const OLIVE = {
  strong: "var(--chart-4)",
  mid: "var(--chart-3)",
  soft: "var(--chart-2)",
  pale: "var(--chart-1)",
  primary: "var(--primary)",
} as const;

export const CHART_COLORS = OLIVE;

function axisProps() {
  return {
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    tick: AXIS_TICK,
  } as const;
}

function compact(value: number) {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(value);
}

/* ------------------------------------------------------- iNaturalist: scans */

export interface ScanPoint {
  run: string;
  label: string;
  newRecords: number;
  rechecked: number;
  changed: number;
}

const scanConfig = {
  newRecords: { label: "New records", color: OLIVE.strong },
  rechecked: { label: "Rechecked", color: OLIVE.mid },
  changed: { label: "Changed", color: OLIVE.soft },
} satisfies ChartConfig;

export function InatScanArea({ data, className }: { data: ScanPoint[]; className?: string }) {
  return (
    <ChartContainer config={scanConfig} className={className}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
        <defs>
          <linearGradient id="inat-new" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={OLIVE.strong} stopOpacity={0.32} />
            <stop offset="95%" stopColor={OLIVE.strong} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="inat-recheck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={OLIVE.mid} stopOpacity={0.24} />
            <stop offset="95%" stopColor={OLIVE.mid} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="label" interval="preserveStartEnd" {...axisProps()} />
        <YAxis width={38} tickFormatter={compact} {...axisProps()} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Area
          type="monotone"
          dataKey="rechecked"
          stroke={OLIVE.mid}
          strokeWidth={1.5}
          fill="url(#inat-recheck)"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="newRecords"
          stroke={OLIVE.strong}
          strokeWidth={2}
          fill="url(#inat-new)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/* -------------------------------------------------------- iNaturalist: taxa */

export interface TaxonPoint {
  taxon: string;
  count: number;
  share: number;
}

const taxaConfig = {
  count: { label: "Records", color: OLIVE.strong },
} satisfies ChartConfig;

export function InatTaxaBar({ data, className }: { data: TaxonPoint[]; className?: string }) {
  return (
    <ChartContainer config={taxaConfig} className={className}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="taxon"
          width={82}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} isAnimationActive={false}>
          {data.map((row, index) => (
            <Cell
              key={row.taxon}
              fill={index === 0 ? OLIVE.strong : index < 3 ? OLIVE.mid : OLIVE.soft}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* --------------------------------------------------- regional species counts */

export interface CountryPoint {
  code: string;
  name: string;
  flag: string;
  value: number;
  [key: string]: string | number;
}

export function CountryBar({
  data,
  dataKey,
  seriesLabel,
  className,
  color = OLIVE.strong,
}: {
  data: CountryPoint[];
  dataKey: string;
  seriesLabel: string;
  className?: string;
  color?: string;
}) {
  const config = { [dataKey]: { label: seriesLabel, color } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="code" {...axisProps()} />
        <YAxis width={40} tickFormatter={compact} {...axisProps()} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}

/* --------------------------------------------------------- grouped bar chart */

export interface GroupedPoint {
  key: string;
  [series: string]: string | number;
}

export function GroupedBar({
  data,
  series,
  xKey = "key",
  className,
}: {
  data: GroupedPoint[];
  series: { key: string; label: string; color: string }[];
  xKey?: string;
  className?: string;
}) {
  const config = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} {...axisProps()} />
        <YAxis width={40} tickFormatter={compact} {...axisProps()} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        {series.map((item) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            fill={`var(--color-${item.key})`}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/* --------------------------------------------------------- IUCN status donut */

export interface DonutPoint {
  key: string;
  label: string;
  value: number;
}

export function StatusDonut({ data, className }: { data: DonutPoint[]; className?: string }) {
  const config = Object.fromEntries(
    data.map((row, index) => [
      row.key,
      {
        label: row.label,
        color: [OLIVE.strong, OLIVE.mid, OLIVE.soft, OLIVE.pale, "var(--border)"][index % 5],
      },
    ]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={className}>
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="key" hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius="58%"
          outerRadius="88%"
          paddingAngle={2}
          strokeWidth={0}
          isAnimationActive={false}
        >
          {data.map((row, index) => (
            <Cell
              key={row.key}
              fill={[OLIVE.strong, OLIVE.mid, OLIVE.soft, OLIVE.pale, "var(--border)"][index % 5]}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ line */

export interface YearPoint {
  year: number;
  [key: string]: number;
}

export function MultiLine({
  data,
  series,
  className,
}: {
  data: YearPoint[];
  series: { key: string; label: string; color: string }[];
  className?: string;
}) {
  const config = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={className}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="year" {...axisProps()} />
        <YAxis width={40} tickFormatter={compact} {...axisProps()} />
        <ChartTooltip cursor={{ stroke: "var(--border)", strokeWidth: 1 }} content={<ChartTooltipContent indicator="line" />} />
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            stroke={item.color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

/* --------------------------------------------------------------- sparkline */

/** Dependency-free sparkline for metric-card corners. */
export function Sparkline({
  values,
  className,
  width = 88,
  height = 24,
}: {
  values: number[];
  className?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - 2 - ((value - min) / span) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
