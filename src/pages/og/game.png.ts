import { gameCard, renderPng } from '../../og'

export async function GET() {
  return renderPng(await gameCard())
}
