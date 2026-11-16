import { getImage, inferRemoteSize } from 'astro:assets'
import { getCollection } from 'astro:content'

import { formatBakes, WORKER_BASE } from './utils'

/**
 * Every bake, newest first. Both the list page and the detail page's
 * prev/next links depend on this ordering, so they share it.
 *
 * Kept out of `utils.ts` on purpose: `astro.config.mjs` imports that module for
 * `WORKER_DOMAIN`, and pulling `astro:content` into the config's import graph
 * breaks config loading.
 */
export async function sortedBakes() {
  const bakes = formatBakes(await getCollection('bakes'))
  bakes.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  return bakes
}

export type SortedBakes = Awaited<ReturnType<typeof sortedBakes>>

/** The bake at `i`, plus the older and newer bakes either side of it. */
export function bakeWithNeighbours(bakes: SortedBakes, i: number) {
  return {
    bake: bakes[i],
    prev: bakes[i + 1] || null,
    next: bakes[i - 1] || null,
  }
}

/* ---------- numbers for the bake pages ---------- */

type BakeData = SortedBakes[number]['data']

const isFlour = (n: string) =>
  /flour|^whole wheat$|^rye$|^whole grain$/i.test(n.trim()) && !/starter/i.test(n)
const isWater = (n: string) => /^water$/i.test(n.trim())
const isStarter = (n: string) => /starter/i.test(n)

/**
 * Flour, water and starter in grams, and hydration. Starter counts as half flour, half
 * water (a 100% hydration starter). Anything not in grams means no hydration or baker's %.
 */
export function dough(data: BakeData) {
  let flour = 0
  let water = 0
  let starter = 0
  let total = 0
  let grams = true
  for (const i of data.ingredients) {
    if (i.unit !== 'g' || i.amount_value == null) {
      grams = false
      continue
    }
    total += i.amount_value
    if (isFlour(i.name)) flour += i.amount_value
    else if (isWater(i.name)) water += i.amount_value
    else if (isStarter(i.name)) starter += i.amount_value
  }
  const hydration =
    grams && flour && water ? (water + starter / 2) / (flour + starter / 2) : null
  return { flour, water, starter, total, grams, hydration }
}

/** A small, stable tilt (in degrees) for a print, so the log looks hand-placed. */
export function tiltFor(id: string, k = 0) {
  let h = 0
  for (const c of id + k) h = (h * 31 + c.charCodeAt(0)) | 0
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 4.4
}

/**
 * A resized webp of a bake photo from the worker. The size is inferred first so the
 * height scales with the width (passing inferSize with a width would keep the original height).
 */
const sizes = new Map<string, ReturnType<typeof inferRemoteSize>>()

export async function bakeImage(url: string, maxWidth: number, quality = 80) {
  const src = `${WORKER_BASE}${url}`
  if (!sizes.has(src)) sizes.set(src, inferRemoteSize(src))
  const size = await sizes.get(src)!
  const width = Math.min(maxWidth, size.width)
  const height = Math.round((width * size.height) / size.width)
  const img = await getImage({ src, width, height, format: 'webp', quality })
  return { src: img.src, width, height }
}
