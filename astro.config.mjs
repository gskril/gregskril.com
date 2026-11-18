import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import { WORKER_DOMAIN } from './src/utils'

// https://astro.build/config
export default defineConfig({
  site: 'https://gregskril.com',
  // /game is an easter egg, so it stays out of the sitemap
  integrations: [sitemap({ filter: (page) => !/\/game\/?$/.test(page) })],
  image: {
    remotePatterns: [{ protocol: 'https', hostname: WORKER_DOMAIN }],
  },
})
