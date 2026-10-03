"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CATEGORICAL, OLIVE } from "@/lib/chart-colors";
import { cn } from "cn";

/**
 * Chart compositions.
 *
 * **Colour tells things apart.** Every series, slice and level a reader has to
 * distinguish is given its own hue — `seriesColors(n)` for identities, a status role
 * when the levels run from good to bad — and is named by a manual legend or a direct
 * label, so identity never rests on colour alone.
 *
 * Never shades of one hue. The preset's `--chart-1 … --chart-5` are five steps of one
 * olive-grey, and two of them side by side are one colour on screen. These
 * compositions once leaned on that ramp for up to three series, darkest first; that
 * guidance is retired, and `lib/chart-colors.ts` says why.
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

/**
 * Teal, indigo, ochre: the three-way split of the categorical ramp validated for
 * neighbouring marks. These were three steps of the olive ramp, which is two areas in
 * one colour.
 */
const SCAN = { newRecords: CATEGORICAL[4], rechecked: CATEGORICAL[6], changed: CATEGORICAL[2] } as const;

const scanConfig = {
  newRecords: { label: "New records", color: SCAN.newRecords },
  rechecked: { label: "Rechecked", color: SCAN.rechecked },
  changed: { label: "Changed", color: SCAN.changed },
} satisfies ChartConfig;

export function InatScanArea({ data, className }: { data: ScanPoint[]; className?: string }) {
  return (
    <ChartContainer config={scanConfig} className={cn("w-full min-w-0", className)}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
        <defs>
          <linearGradient id="inat-new" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={SCAN.newRecords} stopOpacity={0.32} />
            <stop offset="95%" stopColor={SCAN.newRecords} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="inat-recheck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={SCAN.rechecked} stopOpacity={0.24} />
            <stop offset="95%" stopColor={SCAN.rechecked} stopOpacity={0.02} />
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
          stroke={SCAN.rechecked}
          strokeWidth={1.5}
          fill="url(#inat-recheck)"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="newRecords"
          stroke={SCAN.newRecords}
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
  count: { label: "Records", color: SCAN.newRecords },
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
          {/* One measure, one colour. The bars used to fade by rank, which coloured
              a category by its own length and told the reader nothing the length had
              not. */}
          {data.map((row) => (
            <Cell key={row.taxon} fill={SCAN.newRecords} />
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
 * Pass `colors`: one hue per slice, from `seriesColors(n)` or the status roles.
 *
 * The fallback is the olive ramp, kept only so callers written before the colour rule
 * do not change under them. It draws the slices as shades of one hue, which is what
 * that rule forbids, so a new donut never relies on it.
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
 * One bar per category, each in its own identity colour.
 *
 * `InatTaxaBar` draws every bar in one colour, because its bars are one measure and
 * the axis already names them. Here the bars are **different things** being compared —
 * three models, three cohorts, three outcomes — and a reader carries each one's colour
 * to the next figure, so each gets its own hue from `seriesColors`.
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
  dots = false,
  domain,
  ticks,
  unit = "",
  labelSeries,
}: {
  /** One row per point. A `YearPoint[]` fits; so does any row keyed by `xKey`. */
  data: Record<string, string | number>[];
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
  /**
   * Mark every measured point. For a handful of ordered categories the points are the
   * data and the line between them is only a guide to the eye, so the points have to
   * be visible. A long time series leaves this off: there the line is the data.
   */
  dots?: boolean;
  /**
   * Pin the value axis — `[0, 100]` for a share. Without it recharts scales to the
   * data, and two figures of the same measure stop being comparable side by side.
   */
  domain?: [number, number];
  /** Custom explicit tick values for the Y-axis. */
  ticks?: number[];
  /** Appended to axis ticks, point labels and tooltip values, e.g. `"%"`. */
  unit?: string;
  /**
   * The one series whose points carry their value — the series the figure is about.
   * The others are read from the axis and the tooltip: a number on every point of
   * every line collides where lines meet and goes unread everywhere else.
   */
  labelSeries?: string;
}) {
  const config = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  ) satisfies ChartConfig;
  const tick = (value: number) => `${compact(value)}${unit}`;

  return (
    <ChartContainer config={config} className={cn("w-full min-w-0", className)}>
      <LineChart
        data={data}
        // Marked points get the headroom whether or not this figure labels them, so two
        // dotted figures side by side share a baseline and a top.
        margin={{ top: dots || labelSeries ? 20 : 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid {...GRID} />
        <XAxis
          dataKey={xKey}
          // Marked points sit on their category, so the first and last would be cut in
          // half by the plot edge — and take their labels with them.
          padding={dots ? { left: 28, right: 28 } : undefined}
          {...axisProps()}
        />
        <YAxis width={40} domain={domain} ticks={ticks} tickFormatter={tick} {...axisProps()} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={
                unit
                  ? (value, name, item) => (
                      <>
                        <span
                          className="w-1 shrink-0 self-stretch rounded-[2px]"
                          style={{ background: item.color }}
                        />
                        <span className="flex flex-1 items-center justify-between gap-3 leading-none">
                          <span className="text-muted-foreground">
                            {config[String(name)]?.label ?? name}
                          </span>
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {typeof value === "number" ? value.toLocaleString() : String(value)}
                            {unit}
                          </span>
                        </span>
                      </>
                    )
                  : undefined
              }
            />
          }
        />
        {series.map((item) => (
          <Line
            key={item.key}
            type={curve}
            dataKey={item.key}
            stroke={item.color}
            strokeWidth={2}
            // The ring is the card's own colour: it is what keeps a point legible where
            // two lines cross, without drawing an outline that would read as data.
            dot={dots ? { r: 4, fill: item.color, stroke: "var(--card)", strokeWidth: 2 } : false}
            activeDot={{ r: 5, fill: item.color, stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          >
            {labelSeries === item.key ? (
              <LabelList
                dataKey={item.key}
                position="top"
                offset={8}
                fontSize={10}
                className="fill-foreground"
                formatter={(value) => `${String(value)}${unit}`}
              />
            ) : null}
          </Line>
        ))}
      </LineChart>
    </ChartContainer>
  );
}

/* ------------------------------------------------------------------ area */

/**
 * Several series as filled outlines over one ordered axis.
 *
 * The form for the **shape** of a quantity — how scores are spread from low to high,
 * how a count builds through a season — where the reader compares outlines rather than
 * single values. A line chart of the same numbers shows three lines; the fill is what
 * makes each one read as a body with a peak and a tail.
 *
 * - **Not stacked.** Each area is measured from the baseline, so the height of an
 *   outline is its own value and never the sum of the ones beneath it.
 * - **Three series at most.** The fill is the series' hue at low opacity, so two or
 *   three shapes can overlap and every outline stays legible. Past three the overlaps
 *   turn to mud, and the figure wants one small area per series instead.
 * - **The x values are strings**, in order. The tooltip heads itself with `labelKey`
 *   when the axis tick is an abbreviation of it (`0.7` on the axis, `0.7 to 0.8` in the
 *   tooltip).
 */
export function MultiArea({
  data,
  series,
  className,
  xKey = "key",
  labelKey,
  curve = "monotone",
  unit = "",
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
  className?: string;
  xKey?: string;
  /** The field that heads the tooltip, when it should say more than the axis tick. */
  labelKey?: string;
  curve?: "monotone" | "linear";
  /** Appended to axis ticks, e.g. `"%"`. */
  unit?: string;
}) {
  const config = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={cn("w-full min-w-0", className)}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} interval="preserveStartEnd" {...axisProps()} />
        <YAxis
          width={38}
          allowDecimals={false}
          tickFormatter={(value: number) => `${compact(value)}${unit}`}
          {...axisProps()}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={
                labelKey
                  ? (value, payload) => String(payload?.[0]?.payload?.[labelKey] ?? value ?? "")
                  : undefined
              }
            />
          }
        />
        {series.map((item) => (
          <Area
            key={item.key}
            type={curve}
            dataKey={item.key}
            stroke={item.color}
            strokeWidth={2}
            fill={item.color}
            fillOpacity={0.14}
            activeDot={{ r: 4, fill: item.color, stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

/* ----------------------------------------------------------------- radar */

/**
 * Two or three series compared across a handful of categories, as overlaid outlines.
 *
 * The form for a **profile**: the same measure, on the same scale, taken on five to
 * eight categories that have no natural order — bird families, sites, parameters —
 * where the question is which series is strong where. Each series is one closed
 * outline, so "this one is weak on sunbirds" is a dent a reader finds without reading
 * an axis, which a grouped bar of the same 24 numbers does not offer.
 *
 * It is the wrong form for almost everything else, and the limits are the point:
 *
 * - **One measure, one scale.** Every spoke runs `domain[0]` to `domain[1]`, pinned,
 *   because recharts otherwise scales the spokes to the data and a 60–100 radar makes a
 *   small gap look like a collapse. A share is `[0, 100]`.
 * - **Five to fourteen spokes, three series at most.** Fewer than five is a triangle that
 *   a row of numbers says better; past fourteen the labels collide even at one word
 *   each. The caller chooses which categories earn a spoke and says how in the figure's
 *   footnote.
 * - **The spoke order carries nothing.** The area of an outline depends on which
 *   categories happen to be neighbours, so never read area as a total. Keep the order
 *   fixed by a rule (largest category first) so the shape does not change with a filter
 *   unless the data did.
 * - **Short spoke labels.** They are drawn outside the plot and are not wrapped.
 */
export function MultiRadar({
  data,
  series,
  className,
  axisKey = "key",
  domain = [0, 100],
  unit = "",
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
  className?: string;
  /** The field that names each spoke. */
  axisKey?: string;
  domain?: [number, number];
  /** Appended to the scale's ticks, e.g. `"%"`. */
  unit?: string;
}) {
  const config = Object.fromEntries(
    series.map((item) => [item.key, { label: item.label, color: item.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className={cn("w-full min-w-0", className)}>
      <RadarChart data={data} outerRadius="72%" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey={axisKey} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
        <PolarRadiusAxis
          angle={90}
          domain={domain}
          tickCount={3}
          axisLine={false}
          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
          tickFormatter={(value: number) => `${value}${unit}`}
        />
        {series.map((item) => (
          <Radar
            key={item.key}
            dataKey={item.key}
            stroke={item.color}
            strokeWidth={2}
            fill={item.color}
            // Barely there: three translucent hues laid over each other average to grey,
            // so the outline carries the series and the fill only closes the shape.
            fillOpacity={0.05}
            dot={{ r: 2.5, fill: item.color, stroke: "var(--card)", strokeWidth: 1 }}
            isAnimationActive={false}
          />
        ))}
      </RadarChart>
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

/* ------------------------------------------------------------ radial meter */

/**
 * One share of a fixed whole, drawn as a ring with the figure inside it.
 *
 * A single percentage is not a bar chart. Three bars for three numbers spend a card on
 * an axis, a grid and a legend to say what three labelled rings say in a third of the
 * space — and a bar axis invites being cut at 50 to make a small gap look large. A ring
 * always spans the whole turn, so two meters compare by angle and the scale cannot be
 * cropped.
 *
 * Dependency-free on purpose, like `Sparkline`. A ring is one arc, and drawing it as
 * plain SVG puts it in the server-rendered HTML at its final size; a chart runtime
 * would measure its container after hydration and repaint.
 *
 * The track is the series' own hue at low opacity rather than a neutral grey, so the
 * unfilled part still reads as *this* meter's remainder.
 *
 * `children` sit inside the ring: the figure and at most one short line under it. They
 * are ordinary text and take text tokens, never the data colour.
 */
export function RadialMeter({
  value,
  color = OLIVE.strong,
  thickness = 10,
  children,
  className,
}: {
  /** A share of the whole, 0–100. */
  value: number;
  color?: string;
  /** Ring thickness in viewBox units; the ring is 100 across. */
  thickness?: number;
  children?: ReactNode;
  className?: string;
}) {
  const share = Math.max(0, Math.min(100, value));
  const radius = 50 - thickness / 2;
  // A round cap adds half the stroke width to each end, so 75% left alone is painted
  // as roughly 78%. The dash is shortened by its two caps and started one cap in, which
  // makes the painted length the value.
  const cap = (thickness / 2 / (2 * Math.PI * radius)) * 100;
  const rounded = share > cap * 2 && share < 100;

  return (
    <div className={cn("relative aspect-square min-w-0 shrink-0", className)}>
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeOpacity={0.16}
          strokeWidth={thickness}
        />
        {share > 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap={rounded ? "round" : "butt"}
            pathLength={100}
            strokeDasharray={share >= 100 ? undefined : `${rounded ? share - cap * 2 : share} 100`}
            strokeDashoffset={rounded ? -cap : 0}
            transform="rotate(-90 50 50)"
          />
        ) : null}
      </svg>
      {children ? (
        <div className="absolute inset-0 grid place-content-center justify-items-center text-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- unit grid */

export interface UnitLevel {
  key: string;
  label: string;
  /** Tailwind classes for a cell at this level, and for its swatch in the key. */
  className: string;
}

export interface UnitCell {
  key: string;
  /** A `UnitLevel` key. */
  level: string;
  /** What this one cell is, named in the tooltip. */
  label?: string;
}

/**
 * One cell per thing counted.
 *
 * A share drawn as a bar asks the reader to trust that "18%" is a lot or a little. The
 * same share drawn as 109 of 589 cells is the count itself, and "one recording in five"
 * stops being a figure of speech. It is the form for a collection small enough to show
 * whole — a few hundred recordings, sites or stations — and for a subset of it shown
 * beside the whole on the same cells.
 *
 * - **Order the cells by level before passing them in.** Grouped, the block reads as a
 *   proportion; in source order it is confetti.
 * - **Every level the reader must tell apart gets its own hue.** Shades of one ramp
 *   read as one colour on screen, however far apart they are in lightness: the first
 *   use of this figure drew three outcomes as dark olive, mid olive and an open cell,
 *   and was sent back as "the same colour". Use the status roles when the levels run
 *   from good to bad, and the categorical ramp otherwise. The key is drawn from the
 *   same classes (`AvailabilityLegend` accepts these levels as they are).
 * - **One tooltip for the whole grid**, driven by the pointer. The cells are memoised,
 *   so a pointer move re-renders the tooltip and nothing else.
 * - **It is a figure.** Put it in a `ChartFrame height="h-auto"`, which gives it
 *   `role="img"` and its name. The cells are not focusable; `onSelect` is a pointer
 *   shortcut, so whatever it opens must also be reachable from a real control.
 */
export function UnitGrid({
  cells,
  levels,
  cellClassName = "size-2",
  onSelect,
  className,
}: {
  cells: UnitCell[];
  levels: UnitLevel[];
  /**
   * The size of one cell. 8px by default; `size-1.5` for a row inside a list, and a
   * responsive size (`size-2 md:size-2.5`) where the block should fill a wider card
   * rather than leave it half empty.
   */
  cellClassName?: string;
  onSelect?: (key: string) => void;
  className?: string;
}) {
  const [tooltip, setTooltip] = useState<{
    index: number;
    x: number;
    y: number;
    flipX: boolean;
    flipY: boolean;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const tooltipShown = tooltip !== null;

  useEffect(() => {
    if (!tooltipShown) return;

    const hide = () => setTooltip(null);
    const hideOutside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !gridRef.current?.contains(event.target)) hide();
    };

    window.addEventListener("scroll", hide, { capture: true, passive: true });
    window.addEventListener("pointerdown", hideOutside);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("pointerdown", hideOutside);
    };
  }, [tooltipShown]);

  const body = useMemo(() => {
    const classes = new Map(levels.map((level) => [level.key, level.className]));
    return cells.map((cell, index) => (
      <span
        key={cell.key}
        data-unit={index}
        className={cn(
          "shrink-0 rounded-[2px] hover:ring-2 hover:ring-foreground/40",
          cellClassName,
          classes.get(cell.level),
        )}
      />
    ));
  }, [cells, levels, cellClassName]);

  const indexOf = (target: EventTarget) => {
    const cell = (target as HTMLElement).closest<HTMLElement>("[data-unit]");
    return cell ? Number(cell.dataset.unit) : null;
  };

  const showTooltip = (event: PointerEvent<HTMLDivElement>) => {
    const index = indexOf(event.target);
    if (index === null) {
      setTooltip(null);
      return;
    }
    setTooltip({
      index,
      x: event.clientX,
      y: event.clientY,
      flipX: event.clientX > window.innerWidth - 260,
      flipY: event.clientY > window.innerHeight - 120,
    });
  };

  const select = (event: MouseEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    // A tap is how a touch reader asks what a cell is. Selecting on the same tap would
    // take them away before the answer appeared, so only a mouse click selects.
    if ((event.nativeEvent as globalThis.PointerEvent).pointerType === "touch") return;
    const index = indexOf(event.target);
    if (index !== null) onSelect(cells[index].key);
  };

  const active = tooltip ? cells[tooltip.index] : undefined;
  const activeLevel = active ? levels.find((level) => level.key === active.level) : undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <div
        ref={gridRef}
        className={cn("flex flex-wrap gap-0.5", onSelect && "cursor-pointer")}
        onPointerMove={showTooltip}
        onPointerDown={showTooltip}
        onPointerLeave={(event) => {
          if (event.pointerType !== "touch") setTooltip(null);
        }}
        onClick={select}
      >
        {body}
      </div>

      {tooltip && active ? (
        <div
          className={cn(
            "pointer-events-none fixed z-50 grid max-w-64 gap-0.5 rounded-lg",
            "border border-border/50 bg-background px-2 py-1.5 text-xs/relaxed shadow-xl",
          )}
          style={{
            left: tooltip.flipX ? tooltip.x - 12 : tooltip.x + 12,
            top: tooltip.flipY ? tooltip.y - 12 : tooltip.y + 12,
            transform: `translate(${tooltip.flipX ? "-100%" : "0"}, ${tooltip.flipY ? "-100%" : "0"})`,
          }}
        >
          {active.label ? <span className="font-medium text-foreground">{active.label}</span> : null}
          {activeLevel ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className={cn("size-2 shrink-0 rounded-[2px]", activeLevel.className)} />
              {activeLevel.label}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- dumbbell */

export interface DumbbellRow {
  key: string;
  label: ReactNode;
  /** The first measurement, drawn as a filled dot. */
  from: number;
  /** The second measurement, drawn as an open ring. */
  to: number;
  /** One line beside the label — usually the two values written out. */
  detail?: ReactNode;
  color?: string;
}

/**
 * The same thing measured twice, one row per thing, on one shared scale.
 *
 * Two bars per row would make the reader compare bar tips across a gap. Here the two
 * measurements sit on the same line, so the distance between them *is* the difference:
 * a long connector is a change, and two marks on top of each other is "no change",
 * which a pair of bars never shows cleanly.
 *
 * The first value is a filled dot and the second an open ring, sized so that the dot
 * sits inside the ring when they coincide. Shape carries which is which, so colour is
 * free to carry the row's identity and the figure survives without it.
 *
 * The scale is the whole range, `0` to `max`. Cropping it to the data would turn a
 * two-point difference into a visible gap, and "there is no gap" is very often the
 * finding this form exists to show.
 */
export function Dumbbell({
  rows,
  max = 100,
  ticks = [0, 50, 100],
  unit = "",
  className,
}: {
  rows: DumbbellRow[];
  max?: number;
  ticks?: number[];
  /** Appended to the scale's tick labels, e.g. `"%"`. */
  unit?: string;
  className?: string;
}) {
  const at = (value: number) => `${Math.max(0, Math.min(100, (value / max) * 100))}%`;

  return (
    <div className={cn("grid min-w-0 gap-3", className)}>
      {rows.map((row) => {
        const color = row.color ?? OLIVE.strong;
        return (
          <div key={row.key} className="grid min-w-0 gap-1.5">
            <div className="flex min-w-0 items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-foreground">{row.label}</span>
              {row.detail ? (
                <span className="shrink-0 text-[0.6875rem] text-muted-foreground tabular-nums">
                  {row.detail}
                </span>
              ) : null}
            </div>
            {/* Inset by half the ring, so a mark at either end of the scale is whole. */}
            <div className="relative mx-2 h-4">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              <span
                className="absolute top-1/2 h-0.5 -translate-y-1/2"
                style={{
                  left: at(Math.min(row.from, row.to)),
                  width: at(Math.abs(row.to - row.from)),
                  background: color,
                }}
              />
              <span
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-card"
                style={{ left: at(row.to), borderColor: color }}
              />
              <span
                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card"
                style={{ left: at(row.from), background: color }}
              />
            </div>
          </div>
        );
      })}
      <div className="relative mx-2 h-3 text-[0.625rem] leading-3 text-muted-foreground tabular-nums">
        {ticks.map((tick) => (
          <span
            key={tick}
            className={cn(
              "absolute top-0",
              tick <= 0 ? "" : tick >= max ? "-translate-x-full" : "-translate-x-1/2",
            )}
            style={{ left: at(tick) }}
          >
            {tick}
            {unit}
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- split bar */

export interface SplitSegment {
  key: string;
  label: ReactNode;
  value: number;
  /** One hue per segment: a status role when the parts run good to bad, else a series colour. */
  color: string;
}

/**
 * One total divided into its parts, as a single bar with its key underneath.
 *
 * The form for "how does this group split" when the group itself keeps changing — under
 * a filter, say. A pie answers the same question in a square of the page; this answers
 * it in a line, so two of them stack and compare by length along one shared width.
 *
 * Dependency-free on purpose, like `RadialMeter`: the segments are flex items grown by
 * their value, so the bar is in the server-rendered HTML and resizes without measuring.
 * Each segment keeps a minimum width, so a part of 1 in 500 is still visibly there,
 * and the count and share are written in the key because a sliver cannot carry a label.
 */
export function SplitBar({
  segments,
  label,
  className,
}: {
  segments: SplitSegment[];
  /** What the whole is, for assistive technology. */
  label: string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const share = (value: number) => (total ? Math.round((100 * value) / total) : 0);

  return (
    <div className={cn("grid min-w-0 gap-2", className)}>
      <div
        role="img"
        aria-label={`${label}: ${segments.map((segment) => `${segment.value} (${share(segment.value)}%)`).join(", ")}`}
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
      >
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.key}
              className="h-full min-w-1 basis-0"
              style={{ flexGrow: segment.value, background: segment.color }}
            />
          ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem]">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: segment.color }}
            />
            <span className="font-medium text-foreground">{segment.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {segment.value.toLocaleString("en-GB")} · {share(segment.value)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
