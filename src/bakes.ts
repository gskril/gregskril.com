import { getCollection } from 'astro:content'

import { formatBakes } from './utils'

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
