// Wraps payment-wallet's reconciliation endpoints on AdminMonitoringController
// (/api/admin/monitoring/reconciliation/*, requires ROLE_ADMIN). "Unmatched
// transactions" reuses the existing audit-log endpoint directly (every
// mismatch reconciliation finds is already logged there as
// RECONCILIATION_MISMATCH_CORRECTED) rather than a new backend list.

export interface ReconciliationResult {
  checked: number
  mismatchesFound: number
  correctedDepositIds: number[]
  runAt: string
}

export interface ReconciliationRun {
  id: number
  checked: number
  mismatchesFound: number
  runAt: string
}

export interface ReconciliationRunFilter {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  size?: number
}

export interface UnmatchedTransaction {
  id: number
  actorType: string
  actorId: number | null
  action: string
  targetType: string
  targetId: number
  details: string | null
  createdAt: string
}

export interface UnmatchedTransactionFilter {
  page?: number
  size?: number
}

interface PageMetadata {
  hasNext: boolean
  hasPrev: boolean
  totalPage: number
  currentPage: number
  limit: number
  totalCount: number
}

interface PageEnvelope<T> {
  traceId: string
  statusCode: number
  message: string
  data: T[]
  metadata: PageMetadata
}

export function useReconciliation() {
  const api = useApi()

  function runNow() {
    return api<ReconciliationResult>('/api/admin/monitoring/reconciliation/run', { method: 'POST' })
  }

  function listRuns(filter: ReconciliationRunFilter = {}) {
    return api<PageEnvelope<ReconciliationRun>>('/api/admin/monitoring/reconciliation/runs', { query: filter })
  }

  function listUnmatched(filter: UnmatchedTransactionFilter = {}) {
    return api<PageEnvelope<UnmatchedTransaction>>('/api/admin/monitoring/audit-logs', {
      query: { ...filter, targetType: 'DEPOSIT', action: 'RECONCILIATION_MISMATCH_CORRECTED' }
    })
  }

  return { runNow, listRuns, listUnmatched }
}
