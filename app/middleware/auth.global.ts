const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password']

export default defineNuxtRouteMiddleware((to) => {
  if (PUBLIC_PATHS.includes(to.path)) return
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated.value) return navigateTo('/login')
})
