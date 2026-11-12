/**
 * Layout helpers for chart forms that the caller lays out before it draws them.
 */

/**
 * Lay circles out without overlap and fit the layout to a figure. The largest circle is
 * in the middle, and each next one is at the free spot nearest the middle. The search is
 * wider than it is tall, to fill a wide figure. A circle's area is its `value`.
 *
 * Returns the items in order of size, largest first, each with the centre `x`, `y` and
 * the radius `r`, in the units of `size`, rounded to one decimal. `PackedCircles` in
 * `components/mri/figures.tsx` draws this output. The same input gives the same layout,
 * so the server and the browser agree.
 */
export function packCircles<T extends { value: number }>(
  items: T[],
  size: { width: number; height: number }
) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const placed: (T & { x: number; y: number; r: number })[] = [];
  const stretch = size.width / size.height;
  for (const item of sorted) {
    const r = Math.sqrt(item.value);
    let spot = { x: 0, y: 0 };
    if (placed.length) {
      search: for (let distance = 0; ; distance += 1.5) {
        for (let step = 0; step < 72; step += 1) {
          const angle = (step / 72) * Math.PI * 2;
          const x = Math.cos(angle) * distance * stretch;
          const y = Math.sin(angle) * distance;
          if (placed.every((other) => Math.hypot(other.x - x, other.y - y) >= other.r + r + 1.5)) {
            spot = { x, y };
            break search;
          }
        }
      }
    }
    placed.push({ ...item, ...spot, r });
  }
  // Fit the layout to the figure, with a margin.
  const left = Math.min(...placed.map((c) => c.x - c.r));
  const right = Math.max(...placed.map((c) => c.x + c.r));
  const top = Math.min(...placed.map((c) => c.y - c.r));
  const bottom = Math.max(...placed.map((c) => c.y + c.r));
  const scale = Math.min((size.width - 16) / (right - left), (size.height - 16) / (bottom - top));
  const round = (value: number) => Math.round(value * 10) / 10;
  return placed.map((c) => ({
    ...c,
    x: round((c.x - (left + right) / 2) * scale + size.width / 2),
    y: round((c.y - (top + bottom) / 2) * scale + size.height / 2),
    r: round(c.r * scale),
  }));
}
