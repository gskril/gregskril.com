/*
  Where each print sits in the pile, as a pure function of the photos and the number of
  columns. Everything is in units of the pile's width, so the same numbers work at any size.

  The build uses this to place the prints in plain CSS (so the pile is already in its final
  spot before any script runs, and without JavaScript), and photos.js uses it again in the
  browser, so the two always agree and nothing moves when the script takes over.
*/

/* small seeded random, so the pile looks the same on every visit */
export const rand = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* Columns by viewport width. The build writes one CSS block per query and the script asks the
   same queries, so the two always pick the same count (measuring the pile instead would
   disagree whenever a scrollbar takes up width). */
export const COLUMN_QUERIES = [
  [2, '(max-width: 565.98px)'],
  [3, '(min-width: 566px) and (max-width: 934.98px)'],
  [4, '(min-width: 935px)'],
];
export const columnsNow = () => {
  const hit = COLUMN_QUERIES.find(([, q]) => window.matchMedia(q).matches);
  return hit ? hit[0] : 4;
};

/**
 * @returns {{ items: { x: number, y: number, pw: number, r: number }[], h: number }}
 *   x, y and pw are shares of the pile's width; r is degrees. The pile is h * width + 24px tall.
 */
export function pileLayout(photos, c) {
  const n = photos.length;
  const cell = 1 / c;
  const R = rand(7 + n);
  const items = [];
  let y = 0, maxB = 0;
  for (let row = 0; row * c < n; row++) {
    const rowItems = photos.slice(row * c, row * c + c);
    const shift = (c - rowItems.length) * cell / 2 + (row % 2 ? cell * 0.08 : -cell * 0.04);
    let rowH = 0;
    rowItems.forEach((p, k) => {
      const land = p.w >= p.h;
      const pw = cell * (land ? 0.98 : 0.76) * (0.94 + R() * 0.1);
      const ph = pw * (p.h / p.w);
      let x = shift + k * cell + (cell - pw) / 2 + (R() - 0.5) * cell * 0.22;
      x = clamp(x, -0.015, 1 - pw + 0.015);
      const yy = y + (R() - 0.5) * cell * 0.12 + (land ? cell * 0.1 : 0);
      items[row * c + k] = { x, y: yy, pw, r: (R() - 0.5) * 13 };
      rowH = Math.max(rowH, ph);
      maxB = Math.max(maxB, yy + ph);
    });
    y += rowH * 0.8;
  }
  return { items, h: maxB };
}
