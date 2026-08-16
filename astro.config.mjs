import { defineConfig } from 'astro/config'
import { WORKER_DOMAIN } from './src/utils'

// https://astro.build/config
export default defineConfig({
  site: 'https://gregskril.com',
  // Astro 7 defaults to 'jsx', which drops the whitespace around inline
  // elements that sit on their own line (how prettier formats them). `true`
  // keeps the lossless HTML compression we had before.
  compressHTML: true,
  image: {
    remotePatterns: [{ protocol: 'https', hostname: WORKER_DOMAIN }],
  },
})
