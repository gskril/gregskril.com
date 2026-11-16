import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import { WORKER_DOMAIN } from './src/utils'

// https://astro.build/config
export default defineConfig({
  site: 'https://gregskril.com',
  integrations: [sitemap()],
  vite: {
    // write the browser scripts in syntax older phones understand (Safari 13+, ~2019),
    // so newer syntax like ??= doesn't stop the whole script on an old device
    build: { target: ['safari13', 'chrome80', 'firefox78'] },
  },
  image: {
    remotePatterns: [{ protocol: 'https', hostname: WORKER_DOMAIN }],
  },
})
