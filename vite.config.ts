import { defineConfig, loadEnv, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'

const LIVEAVATAR_API_URL = 'https://api.liveavatar.com'

/**
 * Dev-server middleware that proxies LiveAvatar REST calls so the
 * HeyGen/LiveAvatar API key never reaches the browser. The frontend only
 * ever sees short-lived session tokens.
 *
 * Endpoints:
 *   POST /api/liveavatar/token   -> POST {api}/v1/sessions/token   (X-API-KEY)
 *   GET  /api/liveavatar/avatars -> GET  {api}/v1/avatars + /v1/avatars/public
 */
function liveAvatarApi(apiKey: string | undefined): Plugin {
  const readBody = (req: IncomingMessage) =>
    new Promise<string>((resolve, reject) => {
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => resolve(body))
      req.on('error', reject)
    })

  const sendJson = (res: ServerResponse, status: number, payload: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
  }

  const handler = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    const url = (req.url ?? '').split('?')[0]
    if (!url.startsWith('/api/liveavatar/')) return next()

    if (!apiKey) {
      return sendJson(res, 500, {
        error:
          'Missing LIVEAVATAR_API_KEY. Copy .env.example to .env and set your HeyGen LiveAvatar API key (app.liveavatar.com/developers).',
      })
    }

    try {
      if (url === '/api/liveavatar/token' && req.method === 'POST') {
        const body = await readBody(req)
        const upstream = await fetch(`${LIVEAVATAR_API_URL}/v1/sessions/token`, {
          method: 'POST',
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: body || '{}',
        })
        return sendJson(res, upstream.status, await upstream.json())
      }

      if (url === '/api/liveavatar/avatars' && req.method === 'GET') {
        const get = async (path: string) => {
          const r = await fetch(`${LIVEAVATAR_API_URL}${path}`, {
            headers: { 'X-API-KEY': apiKey, Accept: 'application/json' },
          })
          return r.ok ? r.json() : null
        }
        // Custom (account-owned) avatars and the public gallery live on
        // separate endpoints; fetch both so the user can pick their own.
        const [custom, publicAvatars] = await Promise.all([
          get('/v1/avatars'),
          get('/v1/avatars/public'),
        ])
        return sendJson(res, 200, { custom, public: publicAvatars })
      }

      return sendJson(res, 404, { error: `No such endpoint: ${req.method} ${url}` })
    } catch (err) {
      return sendJson(res, 502, {
        error: `LiveAvatar API request failed: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  return {
    name: 'liveavatar-api',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.LIVEAVATAR_API_KEY || env.HEYGEN_API_KEY
  return {
    plugins: [react(), liveAvatarApi(apiKey)],
  }
})
