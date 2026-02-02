import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    url: z.string().url(),
  }),
})

const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/articles' }),
  schema: z.object({
    tags: z.array(z.string()),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
  }),
})

const bakes = defineCollection({
  loader: glob({ pattern: '**/index.md', base: 'src/content/bakes' }),
  schema: ({ image }) =>
    z.object({
      date: z.coerce.date(),
      title: z.string().optional(),
      photos: z.array(image()).optional(),
    }),
})

export const collections = { projects, articles, bakes }
