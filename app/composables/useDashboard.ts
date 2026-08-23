// Wraps payment-wallet's DashboardController — a self-service summary of the
// caller's wallet/deposits/withdrawals/payments, pre-aggregated server-side.

export interface WalletTransactionEntry {
  id: number
  walletId: number
  type: 'CREDIT' | 'DEBIT'
  status: 'PENDING' | 'COMPLETED'
  amount: number
  availableBalanceAfter: number
  pendingBalanceAfter: number
  referenceId: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface TransactionStats {
  totalTransactionCount: number
  creditCount: number
  debitCount: number
  totalCredited: number
  totalDebited: number
}

export interface PaymentStatusSummary {
  pendingCount: number
  successCount: number
  failedCount: number
}

export interface DashboardSummary {
  walletBalance: number
  pendingBalance: number
  currency: string
  totalDeposits: number
  depositCount: number
  totalWithdrawals: number
  withdrawalCount: number
  totalTransfersSent: number
  totalTransfersReceived: number
  transferCount: number
  transactionStats: TransactionStats
  paymentStatusSummary: PaymentStatusSummary
  recentTransactions: WalletTransactionEntry[]
}

interface ApiEnvelope<T> {
  traceId: string
  statusCode: number
  message: string
  data: T
}

export function useDashboard() {
  const api = useApi()

  async function getSummary() {
    const res = await api<ApiEnvelope<DashboardSummary>>('/api/dashboard/me/summary')
    return res.data
  }

  return { getSummary }
}
