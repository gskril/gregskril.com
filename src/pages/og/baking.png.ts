import { sortedBakes } from '../../bakes'
import { bakeLogCard, renderPng } from '../../og'

// The three newest bakes that have a photo, using each one's first photo.
export async function GET() {
  const bakes = await sortedBakes()
  const urls = bakes
    .flatMap((b) => (b.data.photos[0] ? [b.data.photos[0].url] : []))
    .slice(0, 3)
  return renderPng(await bakeLogCard(urls))
}
