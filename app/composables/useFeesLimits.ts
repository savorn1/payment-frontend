// Wraps payment-wallet's admin-only AdminFeesLimitsController
// (/api/admin/fees-limits/*, requires ROLE_ADMIN). Scoped to withdrawal only —
// Deposit and Payment/Transfer have no admin-configurable fee/limit rules
// today (they're free/unlimited by design), so there's nothing else to wrap.

export interface WithdrawalLimitConfig {
  id: number
  flatFee: number
  feePercentage: number
  minAmount: number
  maxAmount: number
  dailyLimit: number
  monthlyLimit: number
  updatedAt: string
}

export interface UpdateWithdrawalLimitConfigPayload {
  flatFee: number
  feePercentage: number
  minAmount: number
  maxAmount: number
  dailyLimit: number
  monthlyLimit: number
}

interface ApiEnvelope<T> {
  traceId: string
  statusCode: number
  message: string
  data: T
}

export function useFeesLimits() {
  const api = useApi()

  async function getWithdrawalConfig() {
    const res = await api<ApiEnvelope<WithdrawalLimitConfig>>('/api/admin/fees-limits/withdrawal')
    return res.data
  }

  async function updateWithdrawalConfig(payload: UpdateWithdrawalLimitConfigPayload) {
    const res = await api<ApiEnvelope<WithdrawalLimitConfig>>('/api/admin/fees-limits/withdrawal', {
      method: 'PUT',
      body: payload
    })
    return res.data
  }

  return { getWithdrawalConfig, updateWithdrawalConfig }
}
