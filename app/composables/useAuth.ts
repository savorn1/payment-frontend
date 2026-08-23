// Auth state persisted in cookies (SSR-safe, survives reloads). Talks to
// payment-wallet's AuthController: POST /api/auth/login|refresh|logout.
// The access token is short-lived (24h, jwt.expiration); the refresh token
// (7d, single-use, revocable server-side via refresh_tokens) lets useApi()
// silently mint a new access token instead of forcing a full re-login.

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  username: string
  role: string
}

export function useAuth() {
  const { apiBase } = useRuntimeConfig().public

  const token = useCookie<string | null>('auth_token', { default: () => null, sameSite: 'lax' })
  const refreshToken = useCookie<string | null>('auth_refresh_token', {
    default: () => null,
    sameSite: 'lax'
  })
  const username = useCookie<string | null>('auth_username', {
    default: () => null,
    sameSite: 'lax'
  })
  const role = useCookie<string | null>('auth_role', { default: () => null, sameSite: 'lax' })

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'ADMIN')

  function applySession(res: AuthResponse) {
    token.value = res.accessToken
    refreshToken.value = res.refreshToken
    username.value = res.username
    role.value = res.role
  }

  async function login(payload: LoginRequest) {
    const res = await $fetch<AuthResponse>('/api/auth/login', {
      baseURL: apiBase,
      method: 'POST',
      body: payload
    })
    applySession(res)
    return res
  }

  // Exchanges the stored refresh token for a new access + refresh token pair
  // (the old refresh token is rotated/invalidated server-side on use).
  async function refresh() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }
    const res = await $fetch<AuthResponse>('/api/auth/refresh', {
      baseURL: apiBase,
      method: 'POST',
      body: { refreshToken: refreshToken.value }
    })
    applySession(res)
    return res
  }

  // Every useApi() call site gets its own closure, so a naive dedup local to useApi()
  // only covers 401s within a single composable instance. Keying the dedup off this
  // module-level variable (shared by every useAuth()/useApi() call in the process)
  // makes concurrent 401s share the same in-flight refresh instead of racing each
  // other — the refresh token is single-use/rotated server-side, so two independent
  // refreshes racing would fail the second one and force-log-out a valid session.
  const refreshOnce = dedupeRefresh(refresh)

  async function forgotPassword(email: string) {
    await $fetch('/api/auth/forgot-password', {
      baseURL: apiBase,
      method: 'POST',
      body: { email }
    })
  }

  async function resetPassword(payload: { token: string; newPassword: string }) {
    await $fetch('/api/auth/reset-password', {
      baseURL: apiBase,
      method: 'POST',
      body: payload
    })
  }

  async function logout() {
    const pendingRefreshToken = refreshToken.value
    token.value = null
    refreshToken.value = null
    username.value = null
    role.value = null
    if (pendingRefreshToken) {
      // Best-effort server-side revocation — the client-side session is already
      // cleared above regardless of whether this call succeeds.
      await $fetch('/api/auth/logout', {
        baseURL: apiBase,
        method: 'POST',
        body: { refreshToken: pendingRefreshToken }
      }).catch(() => {})
    }
  }

  return {
    token,
    username,
    role,
    isAuthenticated,
    isAdmin,
    login,
    refresh,
    refreshOnce,
    forgotPassword,
    resetPassword,
    logout
  }
}

function dedupeRefresh(refresh: () => Promise<AuthResponse>) {
  // useState (not a bare module-level variable) so the in-flight promise is
  // scoped to the current Nuxt app instance — SSR reuses one Node process
  // across every visitor's request, and a module-level variable would leak
  // one user's in-flight refresh into another user's concurrent request.
  return function refreshOnce() {
    const inflight = useState<Promise<AuthResponse> | null>('auth-refresh-inflight', () => null)
    if (!inflight.value) {
      inflight.value = refresh().finally(() => {
        inflight.value = null
      })
    }
    return inflight.value
  }
}
