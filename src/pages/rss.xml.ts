import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context: APIContext) {
  const projects = await getCollection('projects')
  projects.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

  return rss({
    title: 'Greg Skriloff',
    description: 'Small weekend projects and new ideas.',
    site: context.site,
    customData: `<language>en-us</language>`,
    items: projects.map((project) => ({
      title: project.data.title,
      link: project.data.url,
      description: project.body,
      pubDate: project.data.date,
    })),
  })
}
