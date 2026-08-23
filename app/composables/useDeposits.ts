// Wraps payment-wallet's DepositController (/api/deposits/*). There's no real
// payment gateway behind this — SamplePaymentGateway plays the provider's
// role, so a created deposit stays PENDING until either simulateSuccess or
// simulateFailed pushes it through the same signed-callback path a genuine
// webhook would use (see SamplePaymentGateway's class comment on the backend).

export type DepositStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export interface Deposit {
  id: number
  userId: number
  amount: number
  currency: string
  status: DepositStatus
  provider: string
  providerReference: string | null
  paymentUrl: string | null
  qrCodeData: string | null
  failureReason: string | null
  walletTransactionId: number | null
  createdAt: string
  updatedAt: string
}

export interface DepositFilter {
  status?: DepositStatus
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  size?: number
}

// Platform-wide listing (admin-only) — same shape as Deposit, plus a resolved
// username since an admin has no built-in relationship to the depositor.
export interface AdminDeposit {
  id: number
  userId: number
  username: string | null
  amount: number
  currency: string
  status: DepositStatus
  provider: string
  providerReference: string | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminDepositFilter {
  status?: DepositStatus
  userId?: number
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  size?: number
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

export function useDeposits() {
  const api = useApi()

  function listMine(filter: DepositFilter = {}) {
    return api<PageEnvelope<Deposit>>('/api/deposits/me', { query: filter })
  }

  // Admin-only: platform-wide, not scoped to a single user's userId.
  function listAll(filter: AdminDepositFilter = {}) {
    return api<PageEnvelope<AdminDeposit>>('/api/deposits', { query: filter })
  }

  async function get(id: number) {
    const res = await api<ApiEnvelope<Deposit>>(`/api/deposits/${id}`)
    return res.data
  }

  async function create(amount: number) {
    const res = await api<ApiEnvelope<Deposit>>('/api/deposits', {
      method: 'POST',
      // idempotencyKey: a retried request with the same key returns the
      // original deposit instead of opening a second provider session.
      body: { amount, idempotencyKey: crypto.randomUUID() }
    })
    return res.data
  }

  async function checkStatus(id: number) {
    const res = await api<ApiEnvelope<Deposit>>(`/api/deposits/${id}/check-status`, { method: 'POST' })
    return res.data
  }

  // Sandbox-only: there's no real gateway to complete checkout on, so these
  // stand in for "the user finished paying on the provider's page."
  async function simulateSuccess(id: number) {
    const res = await api<ApiEnvelope<Deposit>>(`/api/deposits/${id}/simulate/success`, { method: 'POST' })
    return res.data
  }

  async function simulateFailed(id: number) {
    const res = await api<ApiEnvelope<Deposit>>(`/api/deposits/${id}/simulate/failed`, { method: 'POST' })
    return res.data
  }

  // Self-service (owner or admin), only while still PENDING.
  async function cancel(id: number) {
    const res = await api<ApiEnvelope<Deposit>>(`/api/deposits/${id}/cancel`, { method: 'POST' })
    return res.data
  }

  // Admin-only — reverses a SUCCESS deposit's wallet credit.
  async function refund(id: number) {
    const res = await api<ApiEnvelope<Deposit>>(`/api/deposits/${id}/refund`, { method: 'POST' })
    return res.data
  }

  return { listMine, listAll, get, create, checkStatus, simulateSuccess, simulateFailed, cancel, refund }
}
