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
  minAmount?: number
  maxAmount?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  size?: number
}

// Platform-wide ledger listing (admin-only) — same shape as WalletTransaction,
// plus the owning userId/username (the entity itself only carries walletId).
export interface AdminWalletTransaction {
  id: number
  walletId: number
  userId: number | null
  username: string | null
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

export interface AdminWalletTransactionFilter {
  type?: TransactionType
  status?: TransactionStatus
  userId?: number
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
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

  // Admin-only: platform-wide ledger, not scoped to a single user.
  function listAllTransactions(filter: AdminWalletTransactionFilter = {}) {
    return api<PageEnvelope<AdminWalletTransaction>>('/api/wallets/transactions', { query: filter })
  }

  return { getMine, createMine, listMyTransactions, listAllTransactions }
}
