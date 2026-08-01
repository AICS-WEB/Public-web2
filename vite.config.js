import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import graduateApplicationsHandler from './api/graduate-applications.js'

function registerLocalApi(server, route, handler) {
  server.middlewares.use(route, async (request, response) => {
    const chunks = []

    for await (const chunk of request) {
      chunks.push(chunk)
    }

    try {
      const rawBody = Buffer.concat(chunks).toString('utf8')
      request.body = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      response.statusCode = 400
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ success: false }))
      return
    }

    const apiResponse = {
      setHeader(name, value) {
        response.setHeader(name, value)
      },
      status(code) {
        response.statusCode = code
        return this
      },
      json(payload) {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(payload))
        return payload
      },
    }

    await handler(request, apiResponse)
  })
}

function localApplicationApis() {
  return {
    name: 'local-application-apis',
    configureServer(server) {
      registerLocalApi(
        server,
        '/api/graduate-applications',
        graduateApplicationsHandler,
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  process.env.RESEND_API_KEY = env.RESEND_API_KEY
  process.env.RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL
  process.env.CONTACT_TO_EMAIL = env.CONTACT_TO_EMAIL
  if (env.TURNSTILE_SECRET_KEY) {
    process.env.TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY
  } else {
    delete process.env.TURNSTILE_SECRET_KEY
  }

  return {
    plugins: [react(), localApplicationApis()],
    server: {
      proxy: {
        '/api/public': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
      },
    },
  }
})
