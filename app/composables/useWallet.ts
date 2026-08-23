// Wraps payment-wallet's WalletController /me endpoints.

export interface Wallet {
  id: number
  userId: number
  balance: number
  availableBalance: number
  pendingBalance: number
  currency: string
  createdAt: string
  updatedAt: string
}

interface ApiEnvelope<T> {
  traceId: string
  statusCode: number
  message: string
  data: T
}

export function useWallet() {
  const api = useApi()

  async function getMine() {
    const res = await api<ApiEnvelope<Wallet>>('/api/wallets/me')
    return res.data
  }

  // A newly-created user has no wallet yet — this is a one-time step, not
  // something that happens on every login.
  async function createMine() {
    const res = await api<ApiEnvelope<Wallet>>('/api/wallets', { method: 'POST' })
    return res.data
  }

  return { getMine, createMine }
}
