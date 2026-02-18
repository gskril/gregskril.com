import type { CollectionEntry } from 'astro:content'

export function formatBakes(bakes: CollectionEntry<'bakes'>[]) {
  return bakes.map((bake) => ({
    ...bake,
    data: {
      ...bake.data,
      date: new Date(bake.data.bake_date),
    },
  }))
}

export const WORKER_DOMAIN = 'baking-log.gregskril.workers.dev'
export const WORKER_BASE = `https://${WORKER_DOMAIN}`
