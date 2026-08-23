import type { ApiErrorBody } from '#shared/types'

// Pulls the `message` (and optional field `errors`) out of the standard
// error body so UI code can show it directly.
export function apiErrorMessage(err: unknown): string {
  const data = (err as { data?: ApiErrorBody })?.data
  if (data?.errors) {
    return Object.values(data.errors).join(', ')
  }
  return data?.message ?? 'Something went wrong. Please try again.'
}
