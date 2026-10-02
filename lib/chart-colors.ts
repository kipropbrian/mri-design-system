/**
 * Chart colour, as data rather than as components.
 *
 * ## Why this is not in `components/mri/charts.tsx`
 *
 * That file is a client module. A **server** component that imports a value from a
 * client module does not get the value — it gets a client-reference proxy, because
 * the bundler has to assume the value might be a component. Reading a property off
 * that proxy happens to work, so `CHART_COLORS.strong` in a server page has always
 * looked fine, and `.map` over an array does not: it fails at prerender with
 * `CATEGORICAL.map is not a function`, which names neither the import nor the cause.
 *
 * Colour ramps are constants, so they live here, in a module with no directive, and
 * both the client charts and the server pages import the same object.
 *
 * ## The two ramps
 *
 * `OLIVE` encodes **magnitude**. It is the preset's monochrome olive ramp, five
 * lightness steps, and beyond three series it stops being legible — a fourth shade
 * of the same hue reads as more of the same thing rather than as something else.
 *
 * `CATEGORICAL` encodes **identity**, for charts that plot entities rather than
 * magnitudes: nine countries over time cannot be drawn from `OLIVE` at all. It is a
 * documented token set because its absence produced seventy-one loose hex values
 * across this platform's charts.
 *
 * The palettes and their measurements live in `app/mri-theme.css`.
 */
import type { ChartConfig } from "@/components/ui/chart";

export const OLIVE = {
  strong: "var(--chart-4)",
  mid: "var(--chart-3)",
  soft: "var(--chart-2)",
  pale: "var(--chart-1)",
  primary: "var(--primary)",
} as const;

export const CHART_COLORS = OLIVE;

export const CATEGORICAL = [
  "var(--chart-cat-1)",
  "var(--chart-cat-2)",
  "var(--chart-cat-3)",
  "var(--chart-cat-4)",
  "var(--chart-cat-5)",
  "var(--chart-cat-6)",
  "var(--chart-cat-7)",
  "var(--chart-cat-8)",
  "var(--chart-cat-9)",
] as const;

export const CATEGORICAL_MAX = CATEGORICAL.length;

/**
 * The order identity colours are handed out in.
 *
 * `CATEGORICAL` itself is a **hue wheel**: step 1 to 9 run red → orange → olive →
 * green → teal → blue → indigo → purple → pink. That is the right order for a
 * swatch strip and the wrong order for three series, because the first three steps
 * are the three warmest hues in the set — a three-series chart drawn from them reads
 * as one colour again, which is the failure this ramp exists to prevent.
 *
 * This order takes every third step first (blue, red, green) and then fills in, so
 * **any prefix of it is the most separated set available at that length**. Allocate
 * with `seriesColors(n)`, never with `CATEGORICAL[i]`, whenever the series come from
 * the reader's domain rather than from the data.
 *
 * The one rule that outranks this order: it must be the **same on every figure on a
 * page**. A country that is blue in one chart and red in the next is worse than two
 * countries sharing a colour, because the reader carries the first chart's key into
 * the second.
 */
export const CATEGORICAL_ORDER = [5, 0, 3, 1, 6, 2, 4, 7, 8] as const;

/**
 * The first `count` identity colours, most-separated-first.
 *
 * Throws past nine. Wrapping would silently give two identities the same colour, and
 * a chart with ten identities wants aggregating rather than a tenth hue.
 */
export function seriesColors(count: number): string[] {
  if (count > CATEGORICAL_MAX) {
    throw new Error(
      `seriesColors: ${count} identities exceeds the ${CATEGORICAL_MAX}-step categorical ` +
        `ramp, and wrapping would give two series the same colour. Aggregate the tail into ` +
        `one "Other" series, or move the series onto the olive magnitude ramp.`,
    );
  }
  return CATEGORICAL_ORDER.slice(0, count).map((step) => CATEGORICAL[step]);
}

/**
 * A recharts config where each series owns one identity step, allocated by
 * `seriesColors` — so a two-series chart is blue and red, not the two warmest hues
 * in the set.
 *
 * The *order of the series array* is the caller's, and it must be **stable across
 * every figure on a page**: a country that is blue in one chart and red in the next
 * is worse than two countries sharing a colour, because a reader carries the first
 * chart's key into the second. Sort by the domain — the fixed list of monitored
 * countries — never by the values in hand.
 *
 * More than nine identities throws. Wrapping would silently give two series the
 * same colour, which is the failure this ramp exists to prevent, and a chart with
 * ten categories wants aggregating rather than a tenth hue.
 */
export function categoricalConfig(
  series: readonly { key: string; label: string }[],
): ChartConfig {
  if (series.length > CATEGORICAL_MAX) {
    throw new Error(
      `categoricalConfig: ${series.length} series exceeds the ${CATEGORICAL_MAX}-step ` +
        `categorical ramp, and wrapping would give two series the same colour. Use the ` +
        `olive ramp with three or fewer series, or aggregate the tail into one "Other" series.`,
    );
  }
  const colors = seriesColors(series.length);
  return Object.fromEntries(
    series.map((item, index) => [item.key, { label: item.label, color: colors[index] }]),
  );
}
