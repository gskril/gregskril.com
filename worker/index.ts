type Env = {
  ASSETS: { fetch: typeof fetch }
}

const PLAUSIBLE_ROUTES: Record<string, string> = {
  '/blah/js/script.js': 'https://plausible.io/js/pa-G0mf7uPsIsNvjCfpkmCeu.js',
  '/blah/api/event': 'https://plausible.io/api/event',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const target = PLAUSIBLE_ROUTES[new URL(request.url).pathname]
    if (!target) return env.ASSETS.fetch(request)

    const proxied = new Request(target, request)
    proxied.headers.delete('cookie')

    // Plausible derives visitor location from the forwarded IP
    const clientIp = request.headers.get('CF-Connecting-IP')
    if (clientIp) proxied.headers.set('X-Forwarded-For', clientIp)

    return fetch(proxied)
  },
}
