import type { APIRoute } from 'astro'
import { sortedBakes } from '../../../bakes'
import { bakeCard, renderPng } from '../../../og'

export async function getStaticPaths() {
  const bakes = await sortedBakes()
  return bakes.map((bake) => ({ params: { id: bake.id } }))
}

export const GET: APIRoute = async ({ params }) => {
  const bake = (await sortedBakes()).find((b) => b.id === params.id)
  if (!bake) throw new Error(`No bake matches id "${params.id}"`)
  const { data } = bake
  const date = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(data.date)
  return renderPng(
    await bakeCard({
      title: data.title || 'Bake',
      date,
      photoUrl: data.photos[0]?.url,
      notes: data.notes,
    })
  )
}
