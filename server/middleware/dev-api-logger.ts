// Dev-only visibility into the /api/** proxy: routeRules forwards these
// requests to the backend server-to-server (see nuxt.config.ts), so nothing
// shows up in the browser's Network tab. Logging here makes the proxied
// call visible in the terminal instead.
const backendBase = process.env.NUXT_BACKEND_BASE || 'http://localhost:8089'

export default defineEventHandler((event) => {
  if (import.meta.dev && event.path.startsWith('/api/')) {
    console.log(`[api] ${event.method} ${event.path} -> ${backendBase}${event.path}`)
  }
})
