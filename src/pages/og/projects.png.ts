import { homeCard, renderPng } from '../../og'

// the homepage card, with a line about the projects
export async function GET() {
  return renderPng(await homeCard(['I like to build a lot', 'of side projects.']))
}
