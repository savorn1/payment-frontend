// payment-wallet (the Spring Boot backend this app talks to) has no CORS
// config, so the browser can't call it cross-origin directly. Instead every
// client call hits this server's own /api/** (same origin, baseURL: '') and
// Nitro's routeRules proxy it server-to-server, where CORS doesn't apply.
const backendBase = process.env.NUXT_BACKEND_BASE || 'http://localhost:8089'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/ui'],

  // Adds a `cancelled` color slot alongside Nuxt UI's standard 6 (plus the
  // always-included `neutral`) — StatusBadge needs it distinct from both
  // `warning` (PENDING) and `neutral` (VOIDED/DRAFT/DISABLED), and there's no
  // spare slot among the built-in ones left unclaimed for it.
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'cancelled']
    }
  },

  devServer: {
    port: Number(process.env.NUXT_PORT) || 3000
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Payment'
    }
  },

  runtimeConfig: {
    public: {
      apiBase: ''
    }
  },

  // Nuxt Icon serves icon data from its own /api/_nuxt_icon/** route by
  // default, which collides with the catch-all /api/** proxy below (that
  // sent icon requests to the backend and returned 401s, breaking every
  // lucide icon). Move it outside /api/ so the proxy never sees it.
  icon: {
    localApiEndpoint: '/_nuxt_icon'
  },

  routeRules: {
    '/api/**': { proxy: `${backendBase}/api/**` }
  },

  // useApi()'s 401-retry flow (refresh then redirect to /login on failure) calls
  // composables like navigateTo()/useCookie() after crossing several `await`
  // boundaries; without this, Nuxt loses track of the current app instance at that
  // point and throws instead of redirecting.
  experimental: {
    asyncContext: true
  },

  typescript: {
    strict: true
  }
})
