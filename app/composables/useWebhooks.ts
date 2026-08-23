// Wraps payment-wallet's admin-only AdminWebhookController
// (/api/admin/webhooks/*, requires ROLE_ADMIN) — the platform-wide Webhook
// Management console. Distinct from the merchant-scoped
// /api/merchants/{id}/webhook-deliveries endpoint this app doesn't use.

export type WebhookEventType = 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT_SENT' | 'PAYMENT_RECEIVED'

export interface WebhookDelivery {
  id: number
  merchantId: number
  merchantName: string | null
  eventType: string
  transactionId: number
  url: string
  success: boolean
  httpStatus: number | null
  errorMessage: string | null
  attemptedAt: string
}

export interface WebhookDeliveryFilter {
  merchantId?: number
  eventType?: WebhookEventType
  success?: boolean
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

export function useWebhooks() {
  const api = useApi()

  function listDeliveries(filter: WebhookDeliveryFilter = {}) {
    return api<PageEnvelope<WebhookDelivery>>('/api/admin/webhooks/deliveries', { query: filter })
  }

  async function retryDelivery(id: number) {
    const res = await api<ApiEnvelope<WebhookDelivery>>(`/api/admin/webhooks/deliveries/${id}/retry`, {
      method: 'POST'
    })
    return res.data
  }

  return { listDeliveries, retryDelivery }
}
