import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { WORKER_BASE } from './utils'

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
    subtitle: z.string().nullish(),
    description: z.string(),
    date: z.coerce.date(),
  }),
})

const ingredientSchema = z.object({
  id: z.string(),
  bake_id: z.string(),
  name: z.string(),
  amount: z.string(),
  note: z.string().nullish(),
  sort_order: z.number(),
  created_at: z.string(),
})

const scheduleSchema = z.object({
  id: z.string(),
  bake_id: z.string(),
  time: z.string(),
  action: z.string(),
  note: z.string().nullish(),
  sort_order: z.number(),
  created_at: z.string(),
})

const photoSchema = z.object({
  id: z.string(),
  bake_id: z.string(),
  r2_key: z.string(),
  caption: z.string().nullish(),
  created_at: z.string(),
  url: z.string(),
})

const bakeSchema = z.object({
  id: z.string(),
  title: z.string().nullish(),
  bake_date: z.string(),
  ingredients_text: z.string().nullish(),
  notes: z.string().nullish(),
  created_at: z.string(),
  updated_at: z.string(),
  ingredients: z.array(ingredientSchema),
  schedule: z.array(scheduleSchema),
  photos: z.array(photoSchema),
})

type Bake = z.infer<typeof bakeSchema>

const bakes = defineCollection({
  loader: async () => {
    const res = await fetch(`${WORKER_BASE}/api/export`)
    const json = (await res.json()) as { bakes: Bake[] }
    const { bakes } = json
    return bakes.map((bake) => ({
      id: bake.id as string,
      ...bake,
    }))
  },
  schema: bakeSchema,
})

export const collections = { projects, articles, bakes }
