import { blogCard, renderPng } from '../../og'

export async function GET() {
  return renderPng(await blogCard())
}
