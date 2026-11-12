"use client";

import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "cn";

/**
 * Chart forms drawn in plain SVG.
 *
 * These figures are in the server-rendered HTML at their final proportions. The pointer
 * hover is the only part that runs in the browser. They have no `recharts` import, so this
 * module stays light. `charts.tsx` holds the compositions that need `recharts`.
 */

const whole = (value: number) => Math.round(value).toLocaleString("en-GB");

/**
 * A sparkline with its area filled, in the caller's colour, for a figure tile that shows
 * one count over time. Dependency-free, like `Sparkline`. The floor is zero, so the
 * filled shape is the count and not its range.
 */
export function SparkArea({
  values,
  color,
  className,
}: {
  values: number[];
  color: string;
  className?: string;
}) {
  if (values.length < 2) return null;
  const width = 120;
  const height = 32;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const points = values.map(
    (value, index) =>
      `${(index * step).toFixed(1)},${(height - 1 - (value / max) * (height - 3)).toFixed(1)}`
  );
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <polygon
        points={`0,${height} ${points.join(" ")} ${width},${height}`}
        fill={color}
        fillOpacity={0.18}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------------------------------- hover box, shared */

/**
 * The hover box for the figures below whose marks are not a series on an axis: a flow, a
 * tile, a bubble, a map cell. `ChartTooltipContent` reads a series config, and these
 * marks have none, so they name themselves.
 */
export function HoverBox({
  title,
  rows,
}: {
  title: ReactNode;
  rows?: { label: ReactNode; value: ReactNode }[];
}) {
  return (
    <div className="grid min-w-32 gap-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <span className="font-medium text-foreground">{title}</span>
      {rows?.map((row, index) => (
        <span
          key={index}
          className="flex items-baseline justify-between gap-3 text-muted-foreground"
        >
          <span>{row.label}</span>
          <span className="font-medium text-foreground tabular-nums">{row.value}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * The hover box at the pointer. It sits 12px beside the pointer and flips to the left
 * when the pointer is in the right part of the figure.
 */
function HoverAt({
  x,
  y,
  flip,
  children,
}: {
  x: number;
  y: number;
  flip: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{
        left: x,
        top: y,
        transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -50%)`,
      }}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- dot map */

export interface MapCell {
  lat: number;
  lon: number;
  value: number;
  color: string;
  /** Lines for the hover box. */
  rows: { label: string; value: string }[];
}

/**
 * A map made of the data alone: one square for every grid cell that has any record,
 * and a dot on every cell that has the records the page is about.
 *
 * The grey squares are the cells where the wider source has records, and together they
 * are the shape of the land, so the same marks give the reader the map and the
 * comparison: a grey cell with no dot is a place that was surveyed and not sampled.
 * `borders` adds rough country outlines over the squares, for a reader who has to know
 * where one country ends; without it no coastline and no border is drawn.
 *
 * - **A dot's area is its count**, on one scale for the whole map, largest first so a
 *   small dot is never under a large one.
 * - **A cell is named by its south-west corner**, `cell` degrees on a side.
 * - **Plain SVG**, like `RadialMeter`: a degree is one unit of the view box, so the map
 *   keeps its proportions at any width and is in the server-rendered HTML.
 * - **One hover box for the whole map**, found from the pointer's position.
 */
export function DotMap({
  ground,
  cells,
  cell,
  box,
  labels = [],
  borders = [],
  marks = [],
  scale = 1,
  className,
}: {
  /** `[lat, lon]` of every cell drawn as ground. */
  ground: [number, number][];
  cells: MapCell[];
  cell: number;
  box: { south: number; north: number; west: number; east: number };
  /** Place names written on the map. */
  labels?: { lat: number; lon: number; text: string }[];
  /** Rough country outlines: each line is `[lon, lat]` points. Drawn under the dots. */
  borders?: [number, number][][];
  /** Named places: a ring on the point and the name beside it, on the side given. */
  marks?: { lat: number; lon: number; text: string; side?: "left" | "right" }[];
  /** A multiplier for every dot's radius, for a small map with few dots. */
  scale?: number;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    cell: MapCell;
    x: number;
    y: number;
    flip: boolean;
  } | null>(null);
  const width = box.east - box.west;
  const height = box.north - box.south;
  const largest = Math.max(...cells.map((item) => item.value), 1);
  const radius = (value: number) => scale * cell * (0.2 + 0.95 * Math.sqrt(value / largest));
  const byCell = useMemo(
    () => new Map(cells.map((item) => [`${item.lat},${item.lon}`, item])),
    [cells]
  );
  const ordered = useMemo(() => [...cells].sort((a, b) => b.value - a.value), [cells]);
  const squares = useMemo(
    () =>
      ground.map(([lat, lon]) => (
        <rect
          key={`${lat},${lon}`}
          x={lon - box.west + cell * 0.08}
          y={box.north - lat - cell + cell * 0.08}
          width={cell * 0.84}
          height={cell * 0.84}
          rx={cell * 0.12}
        />
      )),
    [ground, box.west, box.north, cell]
  );

  const outlines = useMemo(
    () =>
      borders.map((line, index) => (
        <path
          key={index}
          d={`M${line.map(([lon, lat]) => `${(lon - box.west).toFixed(2)},${(box.north - lat).toFixed(2)}`).join("L")}`}
          vectorEffect="non-scaling-stroke"
        />
      )),
    [borders, box.west, box.north]
  );

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds) return;
    const lon = box.west + ((event.clientX - bounds.left) / bounds.width) * width;
    const lat = box.north - ((event.clientY - bounds.top) / bounds.height) * height;
    const found = byCell.get(`${Math.floor(lat / cell) * cell},${Math.floor(lon / cell) * cell}`);
    setHover(
      found
        ? {
            cell: found,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            flip: event.clientX - bounds.left > bounds.width * 0.6,
          }
        : null
    );
  }

  return (
    <div
      ref={frame}
      className={cn("relative w-full min-w-0", className)}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden="true">
        <g fill="var(--muted)">{squares}</g>
        {/* A cell with a dot keeps its square, in a stronger grey, so the dot sits on land. */}
        <g fill="var(--border)">
          {ordered.map((item) => (
            <rect
              key={`${item.lat},${item.lon}`}
              x={item.lon - box.west + cell * 0.08}
              y={box.north - item.lat - cell + cell * 0.08}
              width={cell * 0.84}
              height={cell * 0.84}
              rx={cell * 0.12}
            />
          ))}
        </g>
        {borders.length ? (
          <g
            fill="none"
            stroke="var(--foreground)"
            strokeOpacity={0.55}
            strokeWidth={1}
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {outlines}
          </g>
        ) : null}
        {ordered.map((item) => (
          <circle
            key={`${item.lat},${item.lon}`}
            cx={item.lon - box.west + cell / 2}
            cy={box.north - item.lat - cell / 2}
            r={radius(item.value)}
            fill={item.color}
            fillOpacity={0.82}
            stroke="var(--card)"
            strokeWidth={0.04}
          />
        ))}
        {labels.map((label) => (
          <text
            key={label.text}
            x={label.lon - box.west}
            y={box.north - label.lat}
            textAnchor="middle"
            fontSize={0.78}
            fontWeight={600}
            letterSpacing={0.06}
            fill="var(--foreground)"
            stroke="var(--card)"
            strokeWidth={0.22}
            paintOrder="stroke"
          >
            {label.text}
          </text>
        ))}
        {marks.map((mark) => {
          const left = mark.side === "left";
          const x = mark.lon - box.west;
          const y = box.north - mark.lat;
          return (
            <g key={mark.text}>
              <circle
                cx={x}
                cy={y}
                r={0.34}
                fill="none"
                stroke="var(--foreground)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={x + (left ? -0.6 : 0.6)}
                y={y}
                textAnchor={left ? "end" : "start"}
                dominantBaseline="central"
                fontSize={0.62}
                fill="var(--foreground)"
                stroke="var(--card)"
                strokeWidth={0.2}
                paintOrder="stroke"
              >
                {mark.text}
              </text>
            </g>
          );
        })}
      </svg>
      {hover ? (
        <HoverAt x={hover.x} y={hover.y} flip={hover.flip}>
          <HoverBox
            title={`${Math.abs(hover.cell.lat + cell / 2).toFixed(2)}° ${hover.cell.lat + cell / 2 >= 0 ? "N" : "S"}, ${(hover.cell.lon + cell / 2).toFixed(2)}° E`}
            rows={hover.cell.rows}
          />
        </HoverAt>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------- bubble matrix */

export interface MatrixCell {
  /** The column the cell is in. */
  column: string;
  value: number;
  color: string;
  /** Lines for the hover box. */
  rows: { label: string; value: string }[];
}

/**
 * Rows by columns, with a circle in every cell that has a count: a row for each country,
 * a column for each year.
 *
 * The form for "when did each of these happen": a stacked chart of the years gives the
 * total and hides which row a year belongs to, and one line per row puts nine lines on
 * one scale that the largest row sets.
 *
 * - **A circle's area is its count**, on one scale for the whole figure.
 * - **A circle takes the colour the caller gives it**, such as the largest part of its
 *   count. The hover box gives the parts.
 * - **Plain SVG**, like `DotMap`: it is in the server-rendered HTML and keeps its
 *   proportions. Give it a minimum width inside a scrolling box on a phone.
 * - **One hover box for the whole figure**, found from the pointer's position.
 */
export function BubbleMatrix({
  rows,
  columns,
  columnTicks = columns,
  className,
}: {
  rows: { key: string; label: string; total?: string; cells: MatrixCell[] }[];
  columns: string[];
  /** The columns named under the figure. */
  columnTicks?: string[];
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    title: string;
    cell: MatrixCell;
    x: number;
    y: number;
    flip: boolean;
  } | null>(null);
  const LABEL = 92;
  const TOTAL = 56;
  const COLUMN = 24;
  const ROW = 30;
  const FOOT = 22;
  const width = LABEL + columns.length * COLUMN + TOTAL;
  const height = rows.length * ROW + FOOT;
  const largest = Math.max(...rows.flatMap((row) => row.cells.map((cell) => cell.value)), 1);
  const radius = (value: number) => 1.2 + (ROW / 2 - 1.5) * Math.sqrt(value / largest);
  const position = new Map(columns.map((column, index) => [column, index]));

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = ((event.clientX - bounds.left) / bounds.width) * width;
    const y = ((event.clientY - bounds.top) / bounds.height) * height;
    const row = rows[Math.floor(y / ROW)];
    const column = columns[Math.floor((x - LABEL) / COLUMN)];
    const cell = x >= LABEL ? row?.cells.find((item) => item.column === column) : undefined;
    setHover(
      row && cell
        ? {
            title: `${row.label}, ${column}`,
            cell,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            flip: event.clientX - bounds.left > bounds.width * 0.6,
          }
        : null
    );
  }

  return (
    <div
      ref={frame}
      className={cn("relative w-full min-w-0", className)}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden="true">
        {rows.map((row, index) => (
          <g key={row.key}>
            <line
              x1={LABEL}
              x2={LABEL + columns.length * COLUMN}
              y1={index * ROW + ROW / 2}
              y2={index * ROW + ROW / 2}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={LABEL - 10}
              y={index * ROW + ROW / 2}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={10}
              fill="var(--foreground)"
            >
              {row.label}
            </text>
            {row.total ? (
              <text
                x={width}
                y={index * ROW + ROW / 2}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={9}
                fill="var(--muted-foreground)"
              >
                {row.total}
              </text>
            ) : null}
            {[...row.cells]
              .sort((a, b) => b.value - a.value)
              .map((cell) => (
                <circle
                  key={cell.column}
                  cx={LABEL + (position.get(cell.column) ?? 0) * COLUMN + COLUMN / 2}
                  cy={index * ROW + ROW / 2}
                  r={radius(cell.value)}
                  fill={cell.color}
                  fillOpacity={0.85}
                  stroke="var(--card)"
                  strokeWidth={0.75}
                />
              ))}
          </g>
        ))}
        {columnTicks.map((column) => (
          <text
            key={column}
            x={LABEL + (position.get(column) ?? 0) * COLUMN + COLUMN / 2}
            y={rows.length * ROW + 14}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted-foreground)"
          >
            {column}
          </text>
        ))}
      </svg>
      {hover ? (
        <HoverAt x={hover.x} y={hover.y} flip={hover.flip}>
          <HoverBox title={hover.title} rows={hover.cell.rows} />
        </HoverAt>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- flow map */

export interface FlowMapPlace {
  key: string;
  label: string;
  /** The line under the name: the count and its share. Leave both out for a place with no name on the map. */
  detail?: string;
  lat: number;
  lon: number;
  value: number;
  color: string;
  /** Where the name sits beside the circle. */
  side?: "left" | "right" | "top" | "bottom";
}

/**
 * Where things went, on a map: a curved line from one origin to each destination, as
 * wide as its count, and a circle on each destination, as large as its count.
 *
 * The form for "these left here and are now there" when the destinations are places a
 * reader can find on a map. A flow diagram gives the same counts and loses the distance.
 *
 * - **A circle's area and a line's width are the count**, on one scale.
 * - **Plain SVG**, like `DotMap`: a degree is one unit of the view box.
 * - **A place with `label` and `detail` is named on the map.** Name the large ones and
 *   list the small ones under the figure.
 * - **The origin is a place too**: what stayed is drawn as its circle.
 */
export function FlowMap({
  land,
  box,
  origin,
  places,
  lineColor,
  className,
}: {
  /** Land outlines: each ring is `[lon, lat]` points. */
  land: [number, number][][];
  box: { south: number; north: number; west: number; east: number };
  origin: FlowMapPlace;
  places: FlowMapPlace[];
  lineColor: string;
  className?: string;
}) {
  const width = box.east - box.west;
  const height = box.north - box.south;
  const x = (lon: number) => lon - box.west;
  const y = (lat: number) => box.north - lat;
  const largest = Math.max(origin.value, ...places.map((place) => place.value), 1);
  const radius = (value: number) => 0.9 + 8 * Math.sqrt(value / largest);
  const stroke = (value: number) => Math.max(0.25, 7 * (value / largest));
  const outlines = useMemo(
    () =>
      land.map((ring, index) => (
        <path
          key={index}
          d={`M${ring.map(([lon, lat]) => `${(lon - box.west).toFixed(1)},${(box.north - lat).toFixed(1)}`).join("L")}Z`}
        />
      )),
    [land, box.west, box.north]
  );
  const ordered = [...places].sort((a, b) => b.value - a.value);

  const name = (place: FlowMapPlace) => {
    if (!place.detail) return null;
    const r = radius(place.value);
    const side = place.side ?? "right";
    const dx = side === "left" ? -r - 1.5 : side === "right" ? r + 1.5 : 0;
    const dy = side === "top" ? -r - 5.5 : side === "bottom" ? r + 4 : -0.6;
    const anchor = side === "left" ? "end" : side === "right" ? "start" : "middle";
    return (
      <text
        x={x(place.lon) + dx}
        y={y(place.lat) + dy}
        textAnchor={anchor}
        fontSize={3.4}
        fill="var(--foreground)"
        stroke="var(--card)"
        strokeWidth={0.9}
        paintOrder="stroke"
      >
        <tspan fontWeight={600}>{place.label}</tspan>
        <tspan x={x(place.lon) + dx} dy={4} fontSize={3} fill="var(--muted-foreground)">
          {place.detail}
        </tspan>
      </text>
    );
  };

  return (
    <div className={cn("w-full min-w-0", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" aria-hidden="true">
        <g
          fill="var(--muted)"
          stroke="var(--border)"
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        >
          {outlines}
        </g>
        <g fill="none" stroke={lineColor} strokeOpacity={0.45} strokeLinecap="round">
          {ordered.map((place) => {
            const x1 = x(origin.lon);
            const y1 = y(origin.lat);
            const x2 = x(place.lon);
            const y2 = y(place.lat);
            // The line bends away from the straight path, to the north, by a fifth of its length.
            const bend = Math.hypot(x2 - x1, y2 - y1) * 0.2;
            return (
              <path
                key={place.key}
                d={`M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 - bend} ${x2},${y2}`}
                strokeWidth={stroke(place.value)}
              />
            );
          })}
        </g>
        {ordered.map((place) => (
          <circle
            key={place.key}
            cx={x(place.lon)}
            cy={y(place.lat)}
            r={radius(place.value)}
            fill={place.color}
            fillOpacity={0.9}
            stroke="var(--card)"
            strokeWidth={0.4}
          />
        ))}
        <circle
          cx={x(origin.lon)}
          cy={y(origin.lat)}
          r={radius(origin.value)}
          fill={origin.color}
          stroke="var(--card)"
          strokeWidth={0.4}
        />
        {ordered.map((place) => (
          <g key={place.key}>{name(place)}</g>
        ))}
        {name(origin)}
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------- packed circles */

export interface PackedCircle {
  key: string;
  label: string;
  group: string;
  value: number;
  color: string;
  /** The centre and the radius, in the units of `size`. The caller lays the circles out. */
  x: number;
  y: number;
  r: number;
}

/**
 * One circle for each member, as large as its count, packed together and coloured by
 * group.
 *
 * The form for "how unequal are these": one circle that fills half the figure beside
 * dozens that are specks says it without a scale. The layout comes from the caller, so
 * the figure is the same on the server and in the browser.
 *
 * - **A circle's area is its count.**
 * - **A circle is named when its name fits inside it.** The hover box names the others.
 */
export function PackedCircles({
  circles,
  size,
  unit = "records",
  className,
}: {
  circles: PackedCircle[];
  size: { width: number; height: number };
  unit?: string;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    circle: PackedCircle;
    x: number;
    y: number;
    flip: boolean;
  } | null>(null);

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds) return;
    const px = ((event.clientX - bounds.left) / bounds.width) * size.width;
    const py = ((event.clientY - bounds.top) / bounds.height) * size.height;
    const found = circles.find((circle) => Math.hypot(circle.x - px, circle.y - py) <= circle.r);
    setHover(
      found
        ? {
            circle: found,
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
            flip: event.clientX - bounds.left > bounds.width * 0.6,
          }
        : null
    );
  }

  return (
    <div
      ref={frame}
      className={cn("relative w-full min-w-0", className)}
      onPointerMove={onMove}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="block h-auto w-full"
        aria-hidden="true"
      >
        {circles.map((circle) => {
          const font = Math.min(13, Math.max(8, circle.r / 5));
          const fits = circle.label.length * font * 0.56 < circle.r * 1.8 && circle.r > 16;
          return (
            <g key={circle.key}>
              <circle cx={circle.x} cy={circle.y} r={circle.r} fill={circle.color} />
              {fits ? (
                <text
                  x={circle.x}
                  y={circle.y}
                  textAnchor="middle"
                  fontSize={font}
                  fill="var(--card)"
                >
                  <tspan fontWeight={600}>{circle.label}</tspan>
                  <tspan x={circle.x} dy={font * 1.3} fillOpacity={0.9}>
                    {whole(circle.value)}
                  </tspan>
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hover ? (
        <HoverAt x={hover.x} y={hover.y} flip={hover.flip}>
          <HoverBox
            title={hover.circle.label}
            rows={[
              { label: hover.circle.group, value: "" },
              { label: unit, value: whole(hover.circle.value) },
            ]}
          />
        </HoverAt>
      ) : null}
    </div>
  );
}
