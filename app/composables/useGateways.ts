// Wraps payment-wallet's admin-only AdminGatewayController (/api/admin/gateways/*,
// requires ROLE_ADMIN). Single-item endpoints wrap their payload in
// ApiResponse<T>; list/logs wrap in PageResponse<T> — same split as usePayments.ts.

export interface Gateway {
  id: number
  providerName: string
  enabled: boolean
  baseUrl: string
  timeoutMs: number
  maxRetries: number
  retryBackoffMs: number
  latencyMs: number
  maskedSecret: string
  updatedAt: string
}

export interface GatewayCallLog {
  id: number
  target: string
  success: boolean
  result: string
  attempts: number
  durationMs: number
  errorMessage: string | null
  createdAt: string
}

export interface GatewayHealth {
  enabled: boolean
  status: 'UP' | 'DOWN' | 'DISABLED'
  callsLast24h: number
  successCountLast24h: number
  failureCountLast24h: number
  successRate: number | null
  lastCallAt: string | null
  lastCallResult: string | null
}

export interface UpdateGatewayConfigPayload {
  baseUrl: string
  timeoutMs: number
  maxRetries: number
  retryBackoffMs: number
  latencyMs: number
}

export interface GatewayCallLogFilter {
  target?: string
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

export function useGateways() {
  const api = useApi()

  function list() {
    return api<PageEnvelope<Gateway>>('/api/admin/gateways')
  }

  async function get(id: number) {
    const res = await api<ApiEnvelope<Gateway>>(`/api/admin/gateways/${id}`)
    return res.data
  }

  async function updateConfiguration(id: number, payload: UpdateGatewayConfigPayload) {
    const res = await api<ApiEnvelope<Gateway>>(`/api/admin/gateways/${id}/configuration`, {
      method: 'PUT',
      body: payload
    })
    return res.data
  }

  async function updateCredentials(id: number, secret: string) {
    const res = await api<ApiEnvelope<Gateway>>(`/api/admin/gateways/${id}/credentials`, {
      method: 'PUT',
      body: { secret }
    })
    return res.data
  }

  async function enable(id: number) {
    const res = await api<ApiEnvelope<Gateway>>(`/api/admin/gateways/${id}/enable`, { method: 'POST' })
    return res.data
  }

  async function disable(id: number) {
    const res = await api<ApiEnvelope<Gateway>>(`/api/admin/gateways/${id}/disable`, { method: 'POST' })
    return res.data
  }

  async function getHealth(id: number) {
    const res = await api<ApiEnvelope<GatewayHealth>>(`/api/admin/gateways/${id}/health`)
    return res.data
  }

  function listLogs(id: number, filter: GatewayCallLogFilter = {}) {
    return api<PageEnvelope<GatewayCallLog>>(`/api/admin/gateways/${id}/logs`, { query: filter })
  }

  return { list, get, updateConfiguration, updateCredentials, enable, disable, getHealth, listLogs }
}
