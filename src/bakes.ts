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
