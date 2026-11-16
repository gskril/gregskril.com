import { homeCard, renderPng } from '../../og'

export async function GET() {
  return renderPng(await homeCard())
}
