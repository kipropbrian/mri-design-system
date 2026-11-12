/**
 * Specimen data for the figure forms on the review site's `/charts` page.
 *
 * **Every number here is illustrative.** The counts, shares, places and names are
 * invented to show each form with a realistic shape. They describe no real collection,
 * collector or holder. The domain is DNA records on GBIF in East Africa: records by
 * country, method, year, organism group and collector.
 *
 * This module has no directive, so a server page can import it. A value imported from a
 * client module reaches a server page as a reference and not as the value.
 *
 * One colour map serves the whole page. A method has one colour in every specimen, and an
 * organism group has one colour in every specimen.
 */
import type {
  BubblePoint,
  FlowLink,
  FlowNode,
  RadialRow,
  TreeGroup,
} from "@/components/mri/charts";
import type { FlowMapPlace, MapCell, MatrixCell, PackedCircle } from "@/components/mri/figures";
import { packCircles } from "@/lib/chart-layout";
import { seriesColors, SERIES_NEUTRAL } from "@/lib/chart-colors";
import figureMap from "@/lib/data/figure-map.json";

/* ------------------------------------------------------------------ helpers */

/** A number from 0 up to 1 that depends only on its inputs, so the server and the browser agree. */
function unit(...parts: number[]): number {
  let hash = 2166136261;
  for (const part of parts) {
    hash = Math.imul(hash ^ Math.round(part * 10), 16777619);
    hash ^= hash >>> 13;
  }
  hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
  hash ^= hash >>> 13;
  return (hash >>> 0) / 4294967296;
}

/** Split a whole number over weights, so the parts add up to exactly the total. */
function split(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  let running = 0;
  let given = 0;
  return weights.map((weight) => {
    running += weight;
    const upTo = Math.round((running / sum) * total);
    const part = upTo - given;
    given = upTo;
    return part;
  });
}

const count = (value: number) => value.toLocaleString("en-GB");

/* ------------------------------------------------------------------- methods */

export type MethodKey = "barcode" | "sequence" | "edna" | "bank";

export const METHODS: { key: MethodKey; label: string }[] = [
  { key: "barcode", label: "Barcoded specimens" },
  { key: "sequence", label: "Archive sequences" },
  { key: "edna", label: "eDNA" },
  { key: "bank", label: "DNA and tissue banks" },
];

const methodHues = seriesColors(METHODS.length);

/** One colour for each of the four methods, used in every specimen that shows methods. */
export const METHOD_COLOR = Object.fromEntries(
  METHODS.map((method, index) => [method.key, methodHues[index]]),
) as Record<MethodKey, string>;

export const METHOD_LABEL = Object.fromEntries(
  METHODS.map((method) => [method.key, method.label]),
) as Record<MethodKey, string>;

/* ------------------------------------------------------------- organism groups */

/**
 * Three organism groups take the hues after the four method hues, so a group never has
 * the colour of a method on the same page. Smaller groups fold into one grey part.
 */
const groupHues = seriesColors(METHODS.length + 3).slice(METHODS.length);

export const GROUP_KEY = [
  { key: "animals", label: "Animals", color: groupHues[0] },
  { key: "plants", label: "Plants", color: groupHues[1] },
  { key: "fungi", label: "Fungi", color: groupHues[2] },
  { key: "other", label: "Other groups", color: SERIES_NEUTRAL },
];
const groupColor = (key: string) => GROUP_KEY.find((group) => group.key === key)?.color ?? SERIES_NEUTRAL;

/* ----------------------------------------------- the one table behind four figures */

const COUNTRIES = [
  { code: "KE", name: "Kenya", peak: 2019, spread: 3.5, counts: [520, 310, 90, 140] },
  { code: "TZ", name: "Tanzania", peak: 2016, spread: 3, counts: [410, 150, 60, 220] },
  { code: "UG", name: "Uganda", peak: 2021, spread: 3, counts: [260, 180, 30, 40] },
  { code: "ET", name: "Ethiopia", peak: 2022, spread: 2.5, counts: [120, 90, 110, 20] },
  { code: "RW", name: "Rwanda", peak: 2023, spread: 2, counts: [70, 40, 10, 0] },
];

/** Years in which each method peaks, relative to the country's peak. */
const METHOD_SHIFT: Record<MethodKey, number> = { barcode: 0, sequence: -3, edna: 3, bank: -1 };

export const MATRIX_YEARS = Array.from({ length: 14 }, (_, index) => String(2012 + index));
export const MATRIX_TICKS = MATRIX_YEARS.filter((year) => Number(year) % 2 === 0);

/** Records by country, method and year. The sums of this table are the totals in the other figures. */
const BY_YEAR = COUNTRIES.map((country) => ({
  ...country,
  methods: METHODS.map((method, m) => {
    const weights = MATRIX_YEARS.map((year) => {
      const away = (Number(year) - country.peak - METHOD_SHIFT[method.key]) / country.spread;
      return Math.exp(-away * away) * (0.75 + 0.5 * unit(country.peak, Number(year), m));
    });
    return { key: method.key, years: split(country.counts[m], weights) };
  }),
}));

/* --------------------------------------------------------------------- sankey */

/** A method's name on a phone-width figure. */
const METHOD_SHORT: Record<MethodKey, string> = {
  barcode: "Barcodes",
  sequence: "Sequences",
  edna: "eDNA",
  bank: "Banks",
};

export const FLOW_PUBLISHERS = [
  { key: "CA", label: "Canada", short: "Canada", counts: [700, 60, 20, 110] },
  { key: "NO", label: "Norway", short: "Norway", counts: [120, 90, 150, 30] },
  { key: "KE", label: "Kenya", short: "Kenya", counts: [160, 40, 10, 150] },
  { key: "US", label: "United States", short: "US", counts: [260, 480, 60, 90] },
  { key: "OT", label: "Other countries", short: "Other", counts: [140, 100, 60, 40] },
];

export const FLOW_NODES: FlowNode[] = [
  ...COUNTRIES.map((country) => ({ key: `c:${country.code}`, label: country.name, color: SERIES_NEUTRAL })),
  ...METHODS.map((method) => ({
    key: `m:${method.key}`,
    label: method.label,
    short: METHOD_SHORT[method.key],
    color: METHOD_COLOR[method.key],
  })),
  ...FLOW_PUBLISHERS.map((publisher) => ({
    key: `p:${publisher.key}`,
    label: publisher.label,
    short: publisher.short,
    color: "var(--foreground)",
  })),
];

export const FLOW_LINKS: FlowLink[] = [
  ...COUNTRIES.flatMap((country) =>
    METHODS.map((method, m) => ({
      source: `c:${country.code}`,
      target: `m:${method.key}`,
      value: country.counts[m],
    })),
  ),
  ...FLOW_PUBLISHERS.flatMap((publisher) =>
    METHODS.map((method, m) => ({
      source: `m:${method.key}`,
      target: `p:${publisher.key}`,
      value: publisher.counts[m],
    })),
  ),
];

export const FLOW_TOTAL = COUNTRIES.reduce((sum, c) => sum + c.counts.reduce((a, b) => a + b, 0), 0);
export const FLOW_TOP_PUBLISHERS = FLOW_PUBLISHERS.map((publisher) => ({
  label: publisher.label,
  records: publisher.counts.reduce((a, b) => a + b, 0),
})).sort((a, b) => b.records - a.records);

/* -------------------------------------------------------------------- treemap */

const family = (label: string, value: number) => ({ key: label, label, value });

export const TREE_GROUPS: TreeGroup[] = [
  {
    key: "animals",
    label: "Animals",
    color: groupColor("animals"),
    children: [
      family("Noctuidae", 380),
      family("Formicidae", 290),
      family("Carabidae", 210),
      family("Chironomidae", 160),
      family("Cichlidae", 120),
      family("Muscicapidae", 90),
      family("Apidae", 85),
      family("Other animal families", 240),
    ],
  },
  {
    key: "plants",
    label: "Plants",
    color: groupColor("plants"),
    children: [
      family("Fabaceae", 240),
      family("Poaceae", 150),
      family("Rubiaceae", 110),
      family("Asteraceae", 80),
      family("Orchidaceae", 60),
      family("Other plant families", 130),
    ],
  },
  {
    key: "fungi",
    label: "Fungi",
    color: groupColor("fungi"),
    children: [
      family("Agaricaceae", 70),
      family("Polyporaceae", 55),
      family("Russulaceae", 40),
      family("Other fungal families", 60),
    ],
  },
  {
    key: "other",
    label: "Other groups",
    color: groupColor("other"),
    children: [family("Bacillaceae", 40), family("Streptomycetaceae", 25), family("No group", 90)],
  },
];

export const TREE_TOTAL = TREE_GROUPS.reduce(
  (sum, group) => sum + group.children.reduce((a, child) => a + child.value, 0),
  0,
);
export const TREE_BY_GROUP = TREE_GROUPS.map((group) => ({
  label: group.label,
  records: group.children.reduce((sum, child) => sum + child.value, 0),
}));

/* --------------------------------------------------------------- stacked bars */

/** One row per country, cut into the four methods. */
export const COUNTRY_METHOD_ROWS: Record<string, string | number>[] = COUNTRIES.map((country) => ({
  key: country.name,
  ...Object.fromEntries(METHODS.map((method, m) => [method.key, country.counts[m]])),
}));

export const METHOD_SERIES = METHODS.map((method) => ({
  key: method.key,
  label: method.label,
  color: METHOD_COLOR[method.key],
}));

/* --------------------------------------------------------------- radial bars */

/** The share of each method's records that name a species. */
export const NAMED_SHARE: (RadialRow & { text: string })[] = [
  { key: "barcode", value: 91 },
  { key: "sequence", value: 78 },
  { key: "bank", value: 64 },
  { key: "edna", value: 23 },
].map((row) => ({
  key: row.key,
  label: METHOD_LABEL[row.key as MethodKey],
  value: row.value,
  color: METHOD_COLOR[row.key as MethodKey],
  text: `${row.value}%`,
}));

/* ------------------------------------------------------------------- bubbles */

const CLASSES: { label: string; group: string; known: number; share: number; tag?: string }[] = [
  { label: "Insects", group: "animals", known: 9000, share: 9, tag: "Insects" },
  { label: "Birds", group: "animals", known: 1100, share: 58, tag: "Birds" },
  { label: "Mammals", group: "animals", known: 400, share: 44 },
  { label: "Reptiles", group: "animals", known: 300, share: 29 },
  { label: "Amphibians", group: "animals", known: 150, share: 33 },
  { label: "Fishes", group: "animals", known: 900, share: 21 },
  { label: "Arachnids", group: "animals", known: 1800, share: 7 },
  { label: "Flowering plants", group: "plants", known: 7000, share: 12, tag: "Flowering plants" },
  { label: "Ferns", group: "plants", known: 700, share: 15 },
  { label: "Mushrooms and allies", group: "fungi", known: 1500, share: 5, tag: "Fungi" },
];

export const BUBBLE_POINTS: BubblePoint[] = CLASSES.map((row) => {
  const withDna = Math.round((row.known * row.share) / 100);
  return {
    key: row.label,
    label: row.label,
    x: row.known,
    y: row.share,
    size: withDna,
    color: groupColor(row.group),
    tag: row.tag,
    rows: [
      { label: "Known species", value: count(row.known) },
      { label: "With a DNA record", value: `${count(withDna)} (${row.share}%)` },
    ],
  };
});

const knownTotal = CLASSES.reduce((sum, row) => sum + row.known, 0);
const withDnaTotal = BUBBLE_POINTS.reduce((sum, point) => sum + point.size, 0);
export const BUBBLE_OVERALL = Math.round((withDnaTotal / knownTotal) * 100);
export const BUBBLE_TICKS = [200, 500, 1000, 2000, 5000, 10000];
export const BUBBLE_TAGGED = BUBBLE_POINTS.filter((point) => point.tag);

/* -------------------------------------------------------------------- stream */

/** Records by year and method, summed over the five countries. */
export const STREAM_DATA: Record<string, string | number>[] = MATRIX_YEARS.map((year, y) => ({
  key: year,
  ...Object.fromEntries(
    METHODS.map((method) => [
      method.key,
      BY_YEAR.reduce(
        (sum, country) => sum + (country.methods.find((m) => m.key === method.key)?.years[y] ?? 0),
        0,
      ),
    ]),
  ),
}));

const yearTotal = (row: Record<string, string | number>) =>
  METHODS.reduce((sum, method) => sum + Number(row[method.key]), 0);
const peakRow = STREAM_DATA.reduce((best, row) => (yearTotal(row) > yearTotal(best) ? row : best));
export const STREAM_PEAK = { year: String(peakRow.key), records: yearTotal(peakRow) };

/** One method's records per year, for a figure tile. */
export const SPARK = METHODS.filter((method) => method.key === "barcode" || method.key === "edna").map(
  (method) => {
    const values = STREAM_DATA.map((row) => Number(row[method.key]));
    return {
      key: method.key,
      label: method.label,
      color: METHOD_COLOR[method.key],
      values,
      total: values.reduce((a, b) => a + b, 0),
      peak: Math.max(...values),
      peakYear: MATRIX_YEARS[values.indexOf(Math.max(...values))],
    };
  },
);

/* -------------------------------------------------------------- bubble matrix */

export const MATRIX_ROWS = BY_YEAR.map((country) => {
  const cells: MatrixCell[] = MATRIX_YEARS.flatMap((year, y) => {
    const parts = country.methods.map((method) => ({ key: method.key, records: method.years[y] }));
    const total = parts.reduce((sum, part) => sum + part.records, 0);
    if (total === 0) return [];
    const main = parts.reduce((best, part) => (part.records > best.records ? part : best));
    return [
      {
        column: year,
        value: total,
        color: METHOD_COLOR[main.key],
        rows: [
          ...parts
            .filter((part) => part.records > 0)
            .map((part) => ({ label: METHOD_LABEL[part.key], value: count(part.records) })),
          { label: "All DNA records", value: count(total) },
        ],
      },
    ];
  });
  const total = country.counts.reduce((a, b) => a + b, 0);
  return { key: country.code, label: country.name, total: count(total), cells };
});

export const MATRIX_PEAKS = MATRIX_ROWS.map((row) => {
  const peak = row.cells.reduce((best, cell) => (cell.value > best.value ? cell : best));
  return { label: row.label, year: peak.column, records: peak.value };
});

/* ---------------------------------------------------------------------- maps */

const toLines = (lines: number[][][]) => lines as [number, number][][];
const BORDERS = toLines(figureMap.borders);
const LAND = toLines(figureMap.land);

function onLand(lon: number, lat: number): boolean {
  return LAND.some((ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}

const MAP_BOX = { south: -12, north: 8, west: 27, east: 44 };
const CELL = 0.5;

/** Cells with a large count, so the map has a clear lead. */
const BIG_CELLS: [number, number, number][] = [
  [-3, 35, 420],
  [-1.5, 36.5, 260],
  [0.5, 32.5, 180],
  [-6.5, 36.5, 150],
  [0.5, 35.5, 110],
];

const groundCells: [number, number][] = [];
const dotCells: MapCell[] = [];
for (let lat = MAP_BOX.south; lat < MAP_BOX.north; lat += CELL) {
  for (let lon = MAP_BOX.west; lon < MAP_BOX.east; lon += CELL) {
    const big = BIG_CELLS.find(([bigLat, bigLon]) => bigLat === lat && bigLon === lon);
    // Lake Victoria is water. The coarse land outline does not show it, so the box is cut out.
    const lake = lon >= 32 && lon < 34 && lat >= -2.5 && lat < 0;
    if (!big && (lake || !onLand(lon + CELL / 2, lat + CELL / 2) || unit(lat, lon) > 0.62)) continue;
    groundCells.push([lat, lon]);
    const value = big ? big[2] : unit(lat, lon, 1) < 0.3 ? Math.round(1 + 90 * unit(lat, lon, 2) ** 3) : 0;
    if (value === 0) continue;
    const weights = METHODS.map((_, m) => unit(lat, lon, 10 + m) ** 2 + (m === 0 ? 0.6 : 0));
    const parts = split(value, weights);
    const lead = parts.indexOf(Math.max(...parts));
    dotCells.push({
      lat,
      lon,
      value,
      color: METHOD_COLOR[METHODS[lead].key],
      rows: [
        ...METHODS.flatMap((method, m) =>
          parts[m] > 0 ? [{ label: method.label, value: count(parts[m]) }] : [],
        ),
        { label: "All DNA records", value: count(value) },
      ],
    });
  }
}

export const DOT_MAP = {
  ground: groundCells,
  cells: dotCells,
  cell: CELL,
  box: MAP_BOX,
  borders: BORDERS,
  labels: [
    { lat: 1.6, lon: 38.0, text: "KENYA" },
    { lat: -6.5, lon: 34.6, text: "TANZANIA" },
    { lat: 1.9, lon: 32.5, text: "UGANDA" },
  ],
  marks: [{ lat: -2.75, lon: 35.25, text: "Site A", side: "right" as const }],
  groundCount: groundCells.length,
  dotCount: dotCells.length,
  top: BIG_CELLS[0][2],
  topCount: BIG_CELLS.length,
};

/** Specimens held, by place of the holder. The origin is East Africa. */
const HELD: { key: string; label: string; lat: number; lon: number; value: number; named: boolean; side?: FlowMapPlace["side"] }[] = [
  { key: "CA", label: "Canada", lat: 45.4, lon: -75.7, value: 890, named: true, side: "top" },
  { key: "US", label: "United States", lat: 36, lon: -90, value: 560, named: true, side: "bottom" },
  { key: "NO", label: "Norway", lat: 59.9, lon: 10.7, value: 390, named: true, side: "top" },
  { key: "GB", label: "United Kingdom", lat: 51.5, lon: -0.1, value: 150, named: false },
  { key: "ZA", label: "South Africa", lat: -26.2, lon: 28, value: 60, named: false },
];
const HELD_HOME = 360;
const HELD_TOTAL = HELD.reduce((sum, place) => sum + place.value, HELD_HOME);
const share = (value: number) => `${Math.round((value / HELD_TOTAL) * 100)}%`;

export const FLOW_MAP = {
  land: LAND,
  box: { west: -130, east: 62, south: -38, north: 74 },
  origin: {
    key: "east-africa",
    label: "East Africa",
    detail: `${count(HELD_HOME)} · ${share(HELD_HOME)}`,
    lat: -1.3,
    lon: 36.8,
    value: HELD_HOME,
    color: "var(--primary)",
    side: "right",
  } satisfies FlowMapPlace,
  places: HELD.map((place) => ({
    key: place.key,
    label: place.label,
    detail: place.named ? `${count(place.value)} · ${share(place.value)}` : undefined,
    lat: place.lat,
    lon: place.lon,
    value: place.value,
    color: "var(--foreground)",
    side: place.side,
  })) satisfies FlowMapPlace[],
  total: HELD_TOTAL,
  home: HELD_HOME,
  unnamed: HELD.filter((place) => !place.named).map((place) => `${place.label} ${count(place.value)}`),
};

/* ------------------------------------------------------------ packed circles */

const COLLECTOR_COUNTS = [
  5200, 1900, 1400, 900, 700, 520, 410, 330, 270, 220, 180, 150, 120, 100, 85, 70, 60, 50, 44, 38,
  32, 28, 24, 20, 17, 14, 12, 10, 8, 6,
];
const collectorName = (index: number) =>
  `Collector ${index < 26 ? String.fromCharCode(65 + index) : `A${String.fromCharCode(65 + index - 26)}`}`;

export const PACKED_SIZE = { width: 480, height: 420 };

/** Each collector's records, as circles. The method is the one the collector used most. */
export const PACKED: PackedCircle[] = packCircles(
  COLLECTOR_COUNTS.map((value, index) => {
    const method = METHODS[Math.floor(unit(index, 3) * 3.99)].key;
    return {
      key: collectorName(index),
      label: collectorName(index),
      group: METHOD_LABEL[method],
      value,
      color: METHOD_COLOR[method],
    };
  }),
  PACKED_SIZE,
);

export const PACKED_TOTAL = COLLECTOR_COUNTS.reduce((a, b) => a + b, 0);
export const PACKED_LEAD = { label: collectorName(0), records: COLLECTOR_COUNTS[0] };
export const PACKED_COUNT = COLLECTOR_COUNTS.length;
export const PACKED_TOP_THREE = COLLECTOR_COUNTS.slice(0, 3).reduce((a, b) => a + b, 0);
