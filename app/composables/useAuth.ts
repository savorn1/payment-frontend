

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
