// Wraps payment-wallet's AdminReportsController (/api/admin/reports/*,
// requires ROLE_ADMIN) — the Reports console's two genuinely new
// aggregations. Every other report view reuses an existing admin listing
// composable instead (useDeposits/useWithdrawals/usePayments/useWallet).

export interface FeeReport {
  withdrawalFeesCollected: number
  withdrawalFeeCount: number
  depositFeesCollected: number
  depositFeeNote: string
  transferFeesCollected: number
  transferFeeNote: string
}

export interface FeeReportFilter {
  startDate?: string
  endDate?: string
}

export interface MerchantReportEntry {
  merchantId: number
  merchantName: string
  userId: number
  depositTotal: number
  depositCount: number
  withdrawalTotal: number
  withdrawalCount: number
  paymentSentTotal: number
  paymentSentCount: number
}

export function useReports() {
  const api = useApi()

  function getFeeReport(filter: FeeReportFilter = {}) {
    return api<FeeReport>('/api/admin/reports/fees', { query: filter })
  }

  function getMerchantReport() {
    return api<MerchantReportEntry[]>('/api/admin/reports/merchants')
  }

  return { getFeeReport, getMerchantReport }
}
