/**
 * Chart colour, as data rather than as components.
 *
 * ## The rule
 *
 * **Colour in a chart tells things apart, so things a reader must tell apart get
 * different hues.** Every series, slice, bar and level takes its own:
 *
 * - `seriesColors(n)` for identities — countries, models, media types;
 * - the status roles — `var(--primary)`, `var(--notable)`, `var(--destructive)` —
 *   when the levels run from good to bad;
 * - one colour for a single series.
 *
 * **Never shades of one hue.** This module used to say the opposite: that the olive
 * ramp "encodes magnitude", and that a chart should draw up to three series from it,
 * darkest first. Charts drawn that way read as one colour at several strengths and
 * were sent back — the OpenAQ network charts on 30 September 2026, the audio report's
 * unit grid on 3 October. Two steps of a ramp are far apart in lightness on paper and
 * the same colour on screen. That guidance is retired, and "it is an ordered scale"
 * is not an exception to it: the unit grid's three levels were ordered.
 *
 * ## Checked sets
 *
 * Different hues only help if a reader can tell them apart, colour-blind readers
 * included. Run through the palette validator on the white card:
 *
 * - **Two series:** `seriesColors(2)`, blue and red. Worst case ΔE 13.7.
 * - **Three series:** teal, purple, orange — `CATEGORICAL[4]`, `[7]`, `[1]`. Of the 84
 *   three-way sets on this ramp, nine pass with every pair compared, and this is the
 *   best (ΔE 12.4 colour-blind, 22.2 otherwise). `seriesColors(3)` is blue, red, green,
 *   and its red and green are ΔE 4.0 apart for a deuteranope.
 * - **Four or more:** no four hues on this ramp stay apart for every pair. Label the
 *   series directly, or fold the tail into "Other".
 * - **Good to bad:** green, gold, red — `--primary`, `--notable`, `--destructive`
 *   (ΔE 9.2 colour-blind, 27.8 otherwise). Not amber: `--warning` against
 *   `--destructive` is ΔE 2.6 for a deuteranope.
 *
 * ## Why this is not in `components/mri/charts.tsx`
 *
 * That file is a client module. A **server** component that imports a value from a
 * client module does not get the value — it gets a client-reference proxy, because
 * the bundler has to assume the value might be a component. Reading a property off
 * that proxy happens to work, so `OLIVE.strong` in a server page has always looked
 * fine, and `.map` over an array does not: it fails at prerender with
 * `CATEGORICAL.map is not a function`, which names neither the import nor the cause.
 *
 * Colours are constants, so they live here, in a module with no directive, and both
 * the client charts and the server pages import the same object.
 *
 * ## The two token sets
 *
 * `CATEGORICAL` is the chart palette: nine hues for identity, allocated through
 * `seriesColors`. It is a documented token set because its absence produced
 * seventy-one loose hex values across this platform's charts.
 *
 * `OLIVE` is the preset's `--chart-1 … --chart-5`: five lightness steps of one
 * olive-grey. It is **not a palette for series**. It is here for a single neutral
 * series where nothing has to be told apart, and for the charts written before the
 * rule above, which keep working until they are redrawn. Those charts are not a
 * pattern to copy.
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

/**
 * @deprecated The name reads as "the chart palette", and that is how three series
 * became three shades of olive. Use `seriesColors(n)` for series, or `OLIVE` by name
 * where a single neutral colour is meant.
 */
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
        `one "Other" series, or split the chart into small multiples.`,
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
        `categorical ramp, and wrapping would give two series the same colour. Aggregate ` +
        `the tail into one "Other" series, or split the chart into small multiples.`,
    );
  }
  const colors = seriesColors(series.length);
  return Object.fromEntries(
    series.map((item, index) => [item.key, { label: item.label, color: colors[index] }]),
  );
}
