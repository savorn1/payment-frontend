export type TableTheme = 'plain' | 'striped' | 'bordered'

export const TABLE_THEMES: TableTheme[] = ['plain', 'striped', 'bordered']

// Persisted in a cookie rather than localStorage so the choice is available
// on the server render and there's no flash of the default style on load.
// Presets live in app.config.ts alongside the rest of the design tokens.
//
// The cookie is also synced with the user's payment-wallet profile
// (PUT/GET /api/users/me/table-theme), so the preference follows them across
// browsers/devices instead of staying pinned to one cookie jar. The initial
// fetch is deduped via useState — DataTable renders per-instance, but every
// instance shares one sync per app load.
export function useTableTheme() {
  const appConfig = useAppConfig()
  const theme = useCookie<TableTheme>('table_theme', {
    default: () => 'striped',
    maxAge: 60 * 60 * 24 * 365
  })

  const synced = useState('table-theme-synced', () => false)
  if (import.meta.client && !synced.value) {
    synced.value = true
    const { isAuthenticated } = useAuth()
    if (isAuthenticated.value) {
      useProfile()
        .getProfile()
        .then((profile) => {
          if (profile.tableTheme && TABLE_THEMES.includes(profile.tableTheme as TableTheme)) {
            theme.value = profile.tableTheme as TableTheme
          }
        })
        .catch(() => {})
    }
  }

  // Applies immediately (cookie) regardless of the backend write's outcome —
  // callers that want to surface a persistence failure should await/catch
  // the returned promise themselves (e.g. to show a toast).
  function setTheme(next: TableTheme) {
    theme.value = next
    return useProfile().updateTableTheme(next)
  }

  const preset = computed(() => appConfig.tableThemes[theme.value])
  const tableUi = computed(() => preset.value.ui)
  const rowEvenClass = computed(() => preset.value.rowEvenClass)
  const sortButtonClass = computed(() => preset.value.sortButtonClass)

  return { theme, setTheme, tableUi, rowEvenClass, sortButtonClass }
}
