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
 * A recharts config where each series owns one identity step, in the order given.
 *
 * The order is the caller's, and it must be **stable across every figure on a
 * page**: a country that is red in one chart and teal in the next is worse than two
 * countries sharing a colour, because a reader carries the first chart's key into
 * the second. Sort by the domain — the fixed list of monitored countries — never by
 * the values in hand.
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
  return Object.fromEntries(
    series.map((item, index) => [item.key, { label: item.label, color: CATEGORICAL[index] }]),
  );
}
