export type MerchantStatus = 'ACTIVE' | 'SUSPENDED'

export interface Merchant {
  id: number
  userId: number
  name: string
  status: MerchantStatus
  webhookUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface MerchantFilter {
  name?: string
  status?: MerchantStatus
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  size?: number
}

export interface CreateMerchantPayload {
  userId: number
  name: string
}

export interface WebhookConfig {
  webhookUrl: string | null
  webhookSecret: string | null
}

export type ApiKeyStatus = 'ACTIVE' | 'REVOKED'

export interface ApiKey {
  id: number
  keyId: string
  status: ApiKeyStatus
  lastUsedAt: string | null
  createdAt: string
}

export interface ApiKeyCreated {
  id: number
  keyId: string
  rawKey: string
  createdAt: string
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

  function list(filter: MerchantFilter = {}) {
    return api<PageEnvelope<Merchant>>('/api/merchants', { query: filter })
  }

  // Search-as-you-type picker — same shape as usePayments.searchRecipients.
  async function search(name: string) {
    const res = await list({ name, size: 10 })
    return res.data
  }

  async function get(id: number) {
    const res = await api<ApiEnvelope<Merchant>>(`/api/merchants/${id}`)
    return res.data
  }

  async function create(payload: CreateMerchantPayload) {
    const res = await api<ApiEnvelope<Merchant>>('/api/merchants', { method: 'POST', body: payload })
    return res.data
  }

  async function update(id: number, name: string) {
    const res = await api<ApiEnvelope<Merchant>>(`/api/merchants/${id}`, { method: 'PUT', body: { name } })
    return res.data
  }

  async function updateStatus(id: number, status: MerchantStatus) {
    const res = await api<ApiEnvelope<Merchant>>(`/api/merchants/${id}/status`, { method: 'PUT', body: { status } })
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

  async function listApiKeys(id: number) {
    const res = await api<ApiEnvelope<ApiKey[]>>(`/api/merchants/${id}/api-keys`)
    return res.data
  }

  // Returns the raw key exactly once — the backend never stores or returns
  // it again after this call.
  async function createApiKey(id: number) {
    const res = await api<ApiEnvelope<ApiKeyCreated>>(`/api/merchants/${id}/api-keys`, { method: 'POST' })
    return res.data
  }

  async function revokeApiKey(id: number, apiKeyId: number) {
    await api(`/api/merchants/${id}/api-keys/${apiKeyId}`, { method: 'DELETE' })
  }

  return {
    list,
    search,
    get,
    create,
    update,
    updateStatus,
    getWebhookConfig,
    updateWebhookConfig,
    listApiKeys,
    createApiKey,
    revokeApiKey
  }
}
