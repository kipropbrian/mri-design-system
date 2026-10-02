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
import { OLIVE } from "@/lib/chart-colors";
import { cn } from "cn";

/**
 * Chart compositions.
 *
 * The preset sets `chartColor: olive`, so `--chart-1 … --chart-5` are a single
 * monochrome olive ramp (light → dark) rather than five hues. These panels lean
 * into that: at most three series per chart, ordered darkest-first, with a
 * manual legend and direct value labels instead of colour-only encoding.
 *
 * Series take their fill from `config[key].color` **directly** rather than from the
 * `var(--color-<key>)` that `ChartContainer` injects. The injected form is the shadcn
 * contract, but a custom property name is a CSS identifier and cannot contain a dot:
 * a series keyed `birdnet-v2.4` asks the browser for `--color-birdnet-v2.4`, which is
 * invalid, so the reference is dropped and the bar renders with SVG's default black
 * fill — silently, with a correct legend beside it. Passing the colour through keeps
 * the tooltip contract (`config[key].color`) and works for any key.
 *
 * ## Why every container also gets `w-full`
 *
 * The generated `ChartContainer` ships `aspect-video` and no width of its own.
 * `ChartFrame` then wraps it in a fixed `h-64`, which leaves the height definite
 * and the width to the aspect ratio — so the chart resolves to `256 × 16/9 ≈ 455px`
 * whatever card it is in. That fits a two-up row on a desktop and silently
 * overflows a single-column card on a phone, where the rightmost bars are clipped
 * with no scrollbar to reach them.
 *
 * A definite width makes the ratio inert, which is what a chart that has already
 * been given a height and a parent wants. `min-w-0` is the other half: without it
 * a grid child refuses to shrink below its content and pushes the card wider than
 * the page.
 */

const AXIS_TICK = { fontSize: 10 } as const;
const GRID = { stroke: "var(--border)", strokeDasharray: "3 3", vertical: false } as const;

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
    <ChartContainer config={scanConfig} className={cn("w-full min-w-0", className)}>
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
    <ChartContainer config={taxaConfig} className={cn("w-full min-w-0", className)}>
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
    <ChartContainer config={config} className={cn("w-full min-w-0", className)}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="code" {...axisProps()} />
        <YAxis width={40} tickFormatter={compact} {...axisProps()} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} isAnimationActive={false} />
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
    <ChartContainer config={config} className={cn("w-full min-w-0", className)}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} {...axisProps()} />
        <YAxis width={40} tickFormatter={compact} {...axisProps()} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        {series.map((item) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            fill={item.color}
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

/**
 * The fallback is the olive magnitude ramp, because a donut's slices are often
 * ordered steps of one measure — strong, medium, weak. When they are *identities*
 * instead (three models, three outcomes), pass `colors` from `seriesColors`; a
 * single hue there claims the slices differ only in amount.
 */
const DONUT_FALLBACK = [OLIVE.strong, OLIVE.mid, OLIVE.soft, OLIVE.pale, "var(--border)"] as const;

export function StatusDonut({
  data,
  className,
  colors = DONUT_FALLBACK,
}: {
  data: DonutPoint[];
  className?: string;
  colors?: readonly string[];
}) {
  const tones = colors.length ? colors : DONUT_FALLBACK;
  const config = Object.fromEntries(
    data.map((row, index) => [
      row.key,
      { label: row.label, color: tones[index % tones.length] },
    ]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={cn("w-full min-w-0", className)}>
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
            <Cell key={row.key} fill={tones[index % tones.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

/* ---------------------------------------------------------- categorical bars */

export interface CategoryPoint {
  key: string;
  value: number;
  [field: string]: string | number;
}

/**
 * One bar per category, on identity colours rather than on a magnitude ramp.
 *
 * The distinction is the whole reason this exists. `InatTaxaBar` shades a single hue
 * because its bars are the same measure at different sizes, and the eye should read
 * "more" and "less". Here the bars are **different things** — three models, three
 * cohorts, three outcomes — so one hue would claim they differ only in amount.
 *
 * `max` pins the axis when every bar is a percentage of a fixed whole, which is the
 * common case; without it recharts scales to the largest bar and two charts of the
 * same measure stop being comparable.
 */
export function CategoryBar({
  data,
  className,
  colors,
  dataKey = "value",
  labelKey = "key",
  seriesLabel,
  max,
}: {
  data: CategoryPoint[];
  className?: string;
  colors: readonly string[];
  dataKey?: string;
  labelKey?: string;
  seriesLabel: string;
  max?: number;
}) {
  const tones = colors.length ? colors : [OLIVE.strong];
  const config = { [dataKey]: { label: seriesLabel, color: tones[0] } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={cn("w-full min-w-0", className)}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={labelKey} {...axisProps()} />
        <YAxis
          width={40}
          domain={max === undefined ? undefined : [0, max]}
          tickFormatter={compact}
          {...axisProps()}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        <Bar dataKey={dataKey} radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((row, index) => (
            <Cell key={String(row[labelKey])} fill={tones[index % tones.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ line */

export interface YearPoint {
  year: string | number;
  [key: string]: string | number;
}

export function MultiLine({
  data,
  series,
  className,
  xKey = "year",
  curve = "monotone",
}: {
  data: YearPoint[];
  series: { key: string; label: string; color: string }[];
  className?: string;
  /** The x field. Defaults to `year`; a categorical axis passes its own key. */
  xKey?: string;
  /**
   * `monotone` smooths between points, which flatters a trend by drawing values
   * that were never measured. A measured relationship — a rate against a threshold
   * — wants `linear`.
   */
  curve?: "monotone" | "linear";
}) {
  const config = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={cn("w-full min-w-0", className)}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} {...axisProps()} />
        <YAxis width={40} tickFormatter={compact} {...axisProps()} />
        <ChartTooltip cursor={{ stroke: "var(--border)", strokeWidth: 1 }} content={<ChartTooltipContent indicator="line" />} />
        {series.map((item) => (
          <Line
            key={item.key}
            type={curve}
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
