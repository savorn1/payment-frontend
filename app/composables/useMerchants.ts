// Wraps payment-wallet's admin-only MerchantController (/api/merchants/*,
// requires ROLE_ADMIN). Single-item endpoints wrap their payload in
// ApiResponse<T>; list wraps in PageResponse<T> — same split as usePayments.ts.
// Scoped here to just what Webhook Management needs (merchant search picker +
// webhook config); full merchant account management (create, API keys) isn't
// covered since nothing on the current checklist needs it yet.

export interface Merchant {
  id: number
  userId: number
  name: string
  status: string
  webhookUrl: string | null
}

export interface WebhookConfig {
  webhookUrl: string | null
  webhookSecret: string | null
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

export function useMerchants() {
  const api = useApi()

  // Search-as-you-type picker — same shape as usePayments.searchRecipients.
  async function search(name: string) {
    const res = await api<PageEnvelope<Merchant>>('/api/merchants', { query: { name, size: 10 } })
    return res.data
  }

  async function getWebhookConfig(id: number) {
    const res = await api<ApiEnvelope<WebhookConfig>>(`/api/merchants/${id}/webhook`)
    return res.data
  }

  async function updateWebhookConfig(id: number, webhookUrl: string) {
    const res = await api<ApiEnvelope<WebhookConfig>>(`/api/merchants/${id}/webhook`, {
      method: 'PUT',
      body: { webhookUrl }
    })
    return res.data
  }

  return { search, getWebhookConfig, updateWebhookConfig }
}
