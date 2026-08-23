// Nuxt auto-imports files under shared/utils (see nuxt.config.ts `imports.dirs`),
// so shared/utils/*.ts call each other via bare global names with no explicit
// imports. Vitest runs outside Nuxt's build pipeline and has no such shim, so
// we replicate it here for the handful of globals the tested utils rely on.
import { formatCurrency, formatDate, formatDateTime, formatEnum, humanize } from './shared/utils/format'
import { formatColumnText } from './shared/utils/columnFormat'

Object.assign(globalThis, {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnum,
  humanize,
  formatColumnText
})
