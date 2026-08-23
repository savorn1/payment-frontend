// Wraps payment-wallet's WithdrawalController (/api/withdrawals/*). Unlike
// deposits, approval/processing/simulate are all admin-only (see the
// controller's @PreAuthorize) — a regular user can only create and view their
// own withdrawal, then wait for an admin to approve/reject it and for
// processing to complete. There's no self-service "simulate" here.

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUCCESS' | 'FAILED'

export interface Withdrawal {
  id: number
  userId: number
  amount: number
  feeAmount: number
  totalAmount: number
  currency: string
  destination: string
  status: WithdrawalStatus
  rejectionReason: string | null
  failureReason: string | null
  provider: string | null
  providerReference: string | null
  walletTransactionId: number | null
  createdAt: string
  updatedAt: string
}

export interface WithdrawalQuote {
  amount: number
  feeAmount: number
  totalAmount: number
  minAmount: number
  maxAmount: number
}

export interface WithdrawalFilter {
  status?: WithdrawalStatus
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  size?: number
}

export interface CreateWithdrawalPayload {
  amount: number
  destination: string
}

interface ApiEnvelope<T> {
  traceId: string
  statusCode: number
  message: string
  data: T
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

export function useWithdrawals() {
  const api = useApi()

  function listMine(filter: WithdrawalFilter = {}) {
    return api<PageEnvelope<Withdrawal>>('/api/withdrawals/me', { query: filter })
  }

  async function get(id: number) {
    const res = await api<ApiEnvelope<Withdrawal>>(`/api/withdrawals/${id}`)
    return res.data
  }

  async function create(payload: CreateWithdrawalPayload) {
    const res = await api<ApiEnvelope<Withdrawal>>('/api/withdrawals', {
      method: 'POST',
      // idempotencyKey: a retried request with the same key returns the
      // original withdrawal instead of holding funds twice.
      body: { ...payload, idempotencyKey: crypto.randomUUID() }
    })
    return res.data
  }

  // Fee/total preview computed via the same formula createWithdrawal uses —
  // never drifts, and also carries the min/max amount limits.
  async function quote(amount: number) {
    const res = await api<ApiEnvelope<WithdrawalQuote>>('/api/withdrawals/quote', { query: { amount } })
    return res.data
  }

  return { listMine, get, create, quote }
}
