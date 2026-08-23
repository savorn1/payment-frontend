// Shared state for a modal that acts on a single row at a time — reset
// password, delete confirmation, and similar row-action dialogs. Ported from
// loan-frontend's shared/composables/useCrudModals.ts pattern, trimmed to just
// the open/target/loading/error slice every one of these dialogs needs; the
// actual API call + success/error handling stays with the caller (matching
// how the rest of this app's pages own their own useApi() calls) instead of
// being folded into the composable.
export function useTargetModal<T>() {
  const open = ref(false)
  const target = ref<T | null>(null)
  const loading = ref(false)
  const error = ref('')

  function openWith(row: T) {
    target.value = row
    error.value = ''
    open.value = true
  }

  return { open, target, loading, error, openWith }
}
