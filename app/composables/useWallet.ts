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

export type TransactionType = 'CREDIT' | 'DEBIT'
export type TransactionStatus = 'PENDING' | 'COMPLETED'

export interface WalletTransaction {
  id: number
  walletId: number
  type: TransactionType
  status: TransactionStatus
  amount: number
  availableBalanceAfter: number
  pendingBalanceAfter: number
  referenceId: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface WalletTransactionFilter {
  type?: TransactionType
  status?: TransactionStatus
  startDate?: string
  endDate?: string
  search?: string
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

  function listMyTransactions(filter: WalletTransactionFilter = {}) {
    return api<PageEnvelope<WalletTransaction>>('/api/wallets/me/transactions', { query: filter })
  }

  return { getMine, createMine, listMyTransactions }
}
