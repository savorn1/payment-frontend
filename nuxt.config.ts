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

  devServer: {
    port: Number(process.env.NUXT_PORT) || 3000
  },

  css: ['~/assets/css/main.css'],

  // app/composables/** is auto-imported by Nuxt's default convention already;
  // shared/composables is this project's spot for composables reused across
  // features that aren't tied to one page (mirrors loan-frontend's layout).
  // `imports.dirs` entries resolve relative to srcDir (app/ in Nuxt 4), so this
  // needs the explicit rootDir alias (~~) to reach the top-level shared/ folder.
  imports: {
    dirs: ['~~/shared/composables']
  },

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
