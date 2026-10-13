import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import { WORKER_DOMAIN } from './src/utils'

// https://astro.build/config
export default defineConfig({
  site: 'https://gregskril.com',
  integrations: [sitemap()],
  image: {
    remotePatterns: [{ protocol: 'https', hostname: WORKER_DOMAIN }],
  },
})
