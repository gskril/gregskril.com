import { defineConfig } from 'astro/config'
import { WORKER_DOMAIN } from './src/utils'

// https://astro.build/config
export default defineConfig({
  site: 'https://gregskril.com',
  image: {
    remotePatterns: [{ protocol: 'https', hostname: WORKER_DOMAIN }],
  },
})
