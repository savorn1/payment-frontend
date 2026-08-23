// Wraps payment-wallet's PaymentController (/api/payments/*). Single-item
// endpoints wrap their payload in ApiResponse<T> ({traceId, statusCode,
// message, data}); list endpoints return PageResponse<T> directly ({...,
// data: T[], metadata}) — the two shapes differ, so each function here
// unwraps whichever one its endpoint actually returns.

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'
export type PaymentDirection = 'ALL' | 'SENT' | 'RECEIVED'

export interface Payment {
  id: number
  payerUserId: number
  payeeUserId: number
  amount: number
  feeAmount: number
  totalAmount: number
  currency: string
  status: PaymentStatus
  description: string | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}

export interface PaymentFilter {
  status?: PaymentStatus
  direction?: PaymentDirection
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  size?: number
}

export interface CreatePaymentRequest {
  payeeUserId: number
  amount: number
  description?: string
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

export function usePayments() {
  const api = useApi()

  function listMine(filter: PaymentFilter = {}) {
    return api<PageEnvelope<Payment>>('/api/payments/me', { query: filter })
  }

  async function get(id: number) {
    const res = await api<ApiEnvelope<Payment>>(`/api/payments/${id}`)
    return res.data
  }

  async function create(payload: CreatePaymentRequest) {
    const res = await api<ApiEnvelope<Payment>>('/api/payments', {
      method: 'POST',
      // idempotencyKey: a retried request with the same key returns the
      // original payment instead of transferring twice — generated per call
      // so the caller never has to think about it.
      body: { ...payload, idempotencyKey: crypto.randomUUID() }
    })
    return res.data
  }

  return { listMine, get, create }
}
