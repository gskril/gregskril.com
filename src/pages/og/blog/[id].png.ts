import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { articleCard, renderPng } from '../../../og'

export async function getStaticPaths() {
  const articles = await getCollection('articles')
  return articles.map((article) => ({ params: { id: article.id }, props: { article } }))
}

export const GET: APIRoute = async ({ props }) => {
  const { data } = props.article
  const date = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(data.date)
  return renderPng(await articleCard({ title: data.title, date }))
}
