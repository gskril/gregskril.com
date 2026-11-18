import { projectsCard, renderPng } from '../../og'

export async function GET() {
  return renderPng(await projectsCard())
}
