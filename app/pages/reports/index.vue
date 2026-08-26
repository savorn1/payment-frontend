<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reports</h1>

    <UTabs v-model="activeTab" :items="tabItems" variant="link" class="w-full">
      <template #transaction>
        <UCard class="mb-4">
          <div class="flex flex-wrap items-end gap-3">
            <DateAmountRangeFilter
              v-model:start-date="txFilter.startDate"
              v-model:end-date="txFilter.endDate"
              v-model:min-amount="txFilter.minAmount"
              v-model:max-amount="txFilter.maxAmount"
            />
          </div>
        </UCard>
        <UCard>
          <UAlert v-if="txError" color="error" variant="subtle" class="mb-3" :title="txError" />
          <DataTable
            :rows="txRows"
            :columns="txColumns"
            :loading="txLoading"
            refreshable
            exportable
            export-filename="transaction-report"
            @refresh="loadTx"
          >
            <template #empty-state>
              <EmptyState
                :icon="txHasFilter ? 'i-lucide-search-x' : 'i-lucide-list'"
                :title="txHasFilter ? 'No transactions match your filters' : 'No transactions yet'"
                :description="txHasFilter ? 'Try a different date or amount range.' : 'Wallet transactions will show up here.'"
              />
            </template>
          </DataTable>
          <div v-if="txTotal > 0" class="pt-4">
            <DataPagination v-model:page="txPage" v-model:page-size="txPageSize" :total="txTotal" />
          </div>
        </UCard>
      </template>

      <template #deposit>
        <UCard class="mb-4">
          <div class="flex flex-wrap items-end gap-3">
            <DateAmountRangeFilter
              v-model:start-date="depositFilter.startDate"
              v-model:end-date="depositFilter.endDate"
              v-model:min-amount="depositFilter.minAmount"
              v-model:max-amount="depositFilter.maxAmount"
            />
          </div>
        </UCard>
        <UCard>
          <UAlert v-if="depositError" color="error" variant="subtle" class="mb-3" :title="depositError" />
          <DataTable
            :rows="depositRows"
            :columns="depositColumns"
            :loading="depositLoading"
            refreshable
            exportable
            export-filename="deposit-report"
            @refresh="loadDeposits"
          >
            <template #empty-state>
              <EmptyState
                :icon="depositHasFilter ? 'i-lucide-search-x' : 'i-lucide-arrow-down-to-line'"
                :title="depositHasFilter ? 'No deposits match your filters' : 'No deposits yet'"
                :description="depositHasFilter ? 'Try a different date or amount range.' : 'Platform-wide deposits will show up here.'"
              />
            </template>
          </DataTable>
          <div v-if="depositTotal > 0" class="pt-4">
            <DataPagination v-model:page="depositPage" v-model:page-size="depositPageSize" :total="depositTotal" />
          </div>
        </UCard>
      </template>

      <template #withdrawal>
        <UCard class="mb-4">
          <div class="flex flex-wrap items-end gap-3">
            <DateAmountRangeFilter
              v-model:start-date="withdrawalFilter.startDate"
              v-model:end-date="withdrawalFilter.endDate"
              v-model:min-amount="withdrawalFilter.minAmount"
              v-model:max-amount="withdrawalFilter.maxAmount"
            />
          </div>
        </UCard>
        <UCard>
          <UAlert v-if="withdrawalError" color="error" variant="subtle" class="mb-3" :title="withdrawalError" />
          <DataTable
            :rows="withdrawalRows"
            :columns="withdrawalColumns"
            :loading="withdrawalLoading"
            refreshable
            exportable
            export-filename="withdrawal-report"
            @refresh="loadWithdrawals"
          >
            <template #empty-state>
              <EmptyState
                :icon="withdrawalHasFilter ? 'i-lucide-search-x' : 'i-lucide-arrow-up-from-line'"
                :title="withdrawalHasFilter ? 'No withdrawals match your filters' : 'No withdrawals yet'"
                :description="withdrawalHasFilter ? 'Try a different date or amount range.' : 'Platform-wide withdrawals will show up here.'"
              />
            </template>
          </DataTable>
          <div v-if="withdrawalTotal > 0" class="pt-4">
            <DataPagination v-model:page="withdrawalPage" v-model:page-size="withdrawalPageSize" :total="withdrawalTotal" />
          </div>
        </UCard>
      </template>

      <template #transfer>
        <UCard class="mb-4">
          <div class="flex flex-wrap items-end gap-3">
            <DateAmountRangeFilter
              v-model:start-date="transferFilter.startDate"
              v-model:end-date="transferFilter.endDate"
              v-model:min-amount="transferFilter.minAmount"
              v-model:max-amount="transferFilter.maxAmount"
            />
          </div>
        </UCard>
        <UCard>
          <UAlert v-if="transferError" color="error" variant="subtle" class="mb-3" :title="transferError" />
          <DataTable
            :rows="transferRows"
            :columns="transferColumns"
            :loading="transferLoading"
            refreshable
            exportable
            export-filename="transfer-payment-report"
            @refresh="loadTransfers"
          >
            <template #empty-state>
              <EmptyState
                :icon="transferHasFilter ? 'i-lucide-search-x' : 'i-lucide-arrow-left-right'"
                :title="transferHasFilter ? 'No transfers match your filters' : 'No transfers yet'"
                :description="transferHasFilter ? 'Try a different date or amount range.' : 'Payments between users will show up here.'"
              />
            </template>
          </DataTable>
          <div v-if="transferTotal > 0" class="pt-4">
            <DataPagination v-model:page="transferPage" v-model:page-size="transferPageSize" :total="transferTotal" />
          </div>
        </UCard>
      </template>

      <template #settlement>
        <UCard class="mb-4">
          <div class="flex flex-wrap items-end gap-3">
            <DateAmountRangeFilter
              v-model:start-date="settlementFilter.startDate"
              v-model:end-date="settlementFilter.endDate"
              v-model:min-amount="settlementFilter.minAmount"
              v-model:max-amount="settlementFilter.maxAmount"
            />
          </div>
        </UCard>
        <UCard>
          <UAlert v-if="settlementError" color="error" variant="subtle" class="mb-3" :title="settlementError" />
          <DataTable
            :rows="settlementRows"
            :columns="settlementColumns"
            :loading="settlementLoading"
            refreshable
            exportable
            export-filename="settlement-report"
            @refresh="loadSettlements"
          >
            <template #empty-state>
              <EmptyState
                :icon="settlementHasFilter ? 'i-lucide-search-x' : 'i-lucide-badge-check'"
                :title="settlementHasFilter ? 'No settlements match your filters' : 'No settlement records yet'"
                :description="settlementHasFilter ? 'Try a different date or amount range.' : 'Successfully matched deposits will show up here.'"
              />
            </template>
          </DataTable>
          <div v-if="settlementTotal > 0" class="pt-4">
            <DataPagination v-model:page="settlementPage" v-model:page-size="settlementPageSize" :total="settlementTotal" />
          </div>
        </UCard>
      </template>

      <template #fee>
        <UCard class="mb-4">
          <div class="flex flex-wrap items-end gap-3">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">From date</label>
              <UInput v-model="feeFilter.startDate" type="date" class="w-40" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">To date</label>
              <UInput v-model="feeFilter.endDate" type="date" class="w-40" />
            </div>
            <UButton
              v-if="feeFilter.startDate || feeFilter.endDate"
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="feeFilter.startDate = undefined; feeFilter.endDate = undefined"
            >
              Clear
            </UButton>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              icon="i-lucide-refresh-cw"
              :loading="feeLoading"
              class="ml-auto"
              @click="loadFeeReport"
            >
              Refresh
            </UButton>
          </div>
        </UCard>
        <UCard>
          <div v-if="feeLoading" class="flex justify-center py-6">
            <UIcon name="i-lucide-loader-circle" class="w-5 h-5 text-gray-400 animate-spin" />
          </div>
          <UAlert v-else-if="feeError" color="error" variant="subtle" :title="feeError" />
          <dl v-else-if="feeReport" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">Withdrawal fees collected</dt>
              <dd class="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {{ formatCurrency(feeReport.withdrawalFeesCollected) }}
              </dd>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {{ feeReport.withdrawalFeeCount }} withdrawal(s)
              </p>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">Deposit fees collected</dt>
              <dd class="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {{ formatCurrency(feeReport.depositFeesCollected) }}
              </dd>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ feeReport.depositFeeNote }}</p>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">Transfer fees collected</dt>
              <dd class="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {{ formatCurrency(feeReport.transferFeesCollected) }}
              </dd>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ feeReport.transferFeeNote }}</p>
            </div>
          </dl>
        </UCard>
      </template>

      <template #merchant>
        <UCard>
          <UAlert v-if="merchantError" color="error" variant="subtle" class="mb-3" :title="merchantError" />
          <DataTable
            :rows="merchantRows"
            :columns="merchantColumns"
            :loading="merchantLoading"
            refreshable
            exportable
            export-filename="merchant-report"
            @refresh="loadMerchants"
            @select="openMerchantTransactions"
          >
            <template #empty-state>
              <EmptyState icon="i-lucide-store" title="No merchant activity yet" description="Merchant totals will show up here once merchants start transacting." />
            </template>
          </DataTable>
        </UCard>
      </template>
    </UTabs>

    <UModal
      v-model:open="showMerchantTransactions"
      :title="selectedMerchantReport ? `${selectedMerchantReport.merchantName} transactions` : 'Merchant transactions'"
      :ui="{ content: 'sm:max-w-4xl' }"
    >
      <template #body>
        <MerchantTransactionsPanel v-if="selectedMerchantReport" :merchant="selectedMerchantReport" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { AdminWalletTransaction } from '~/composables/useWallet'
import type { AdminDeposit } from '~/composables/useDeposits'
import type { AdminWithdrawal } from '~/composables/useWithdrawals'
import type { AdminPayment } from '~/composables/usePayments'
import type { FeeReport, FeeReportFilter, MerchantReportEntry } from '~/composables/useReports'

definePageMeta({ middleware: 'admin' })

const { listAllTransactions } = useWallet()
const { listAll: listAllDeposits } = useDeposits()
const { listAll: listAllWithdrawals } = useWithdrawals()
const { listAll: listAllPayments } = usePayments()
const { getFeeReport, getMerchantReport } = useReports()

const activeTab = ref('transaction')
const tabItems = [
  { label: 'Transaction', icon: 'i-lucide-list', slot: 'transaction' as const, value: 'transaction' },
  { label: 'Deposit', icon: 'i-lucide-arrow-down-to-line', slot: 'deposit' as const, value: 'deposit' },
  { label: 'Withdrawal', icon: 'i-lucide-arrow-up-from-line', slot: 'withdrawal' as const, value: 'withdrawal' },
  { label: 'Transfers / Payments', icon: 'i-lucide-arrow-left-right', slot: 'transfer' as const, value: 'transfer' },
  { label: 'Settlement', icon: 'i-lucide-badge-check', slot: 'settlement' as const, value: 'settlement' },
  { label: 'Fee', icon: 'i-lucide-percent', slot: 'fee' as const, value: 'fee' },
  { label: 'Merchant', icon: 'i-lucide-store', slot: 'merchant' as const, value: 'merchant' }
]

// ── Transaction report ──────────────────────────────────────────────────
const txRows = ref<AdminWalletTransaction[]>([])
const txLoading = ref(false)
const txError = ref('')
const txPage = ref(1)
const txPageSize = ref(10)
const txTotal = ref(0)
const txColumns: ColumnDef<AdminWalletTransaction>[] = [
  { key: 'username', label: 'User', value: (row) => row.username ?? `#${row.userId ?? '?'}` },
  { key: 'type', type: 'badge', color: (row) => (row.type === 'CREDIT' ? 'success' : 'neutral') },
  { key: 'status', type: 'status' },
  { key: 'amount', type: 'currency' },
  { key: 'description', value: (row) => row.description ?? '—', class: 'max-w-xs' },
  { key: 'createdAt', label: 'Date', type: 'datetime', sortable: true }
]
const txFilter = reactive<{ startDate?: string; endDate?: string; minAmount?: number; maxAmount?: number }>({})
const txHasFilter = computed(() => Object.values(txFilter).some((v) => v !== undefined))
async function loadTx() {
  txLoading.value = true
  txError.value = ''
  try {
    const res = await listAllTransactions({
      ...txFilter,
      page: txPage.value,
      size: txPageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    txRows.value = res.data
    txTotal.value = res.metadata.totalCount
  } catch (err) {
    txError.value = apiErrorMessage(err)
  } finally {
    txLoading.value = false
  }
}
watch(txPage, loadTx)
watch(txPageSize, () => { txPage.value = 1; loadTx() })
watch(txFilter, () => { txPage.value === 1 ? loadTx() : (txPage.value = 1) })

// ── Deposit report ───────────────────────────────────────────────────────
const depositRows = ref<AdminDeposit[]>([])
const depositLoading = ref(false)
const depositError = ref('')
const depositPage = ref(1)
const depositPageSize = ref(10)
const depositTotal = ref(0)
const depositColumns: ColumnDef<AdminDeposit>[] = [
  { key: 'username', label: 'User', value: (row) => row.username ?? `#${row.userId}` },
  { key: 'amount', type: 'currency' },
  { key: 'provider', type: 'text' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]
const depositFilter = reactive<{ startDate?: string; endDate?: string; minAmount?: number; maxAmount?: number }>({})
const depositHasFilter = computed(() => Object.values(depositFilter).some((v) => v !== undefined))
async function loadDeposits() {
  depositLoading.value = true
  depositError.value = ''
  try {
    const res = await listAllDeposits({
      ...depositFilter,
      page: depositPage.value,
      size: depositPageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    depositRows.value = res.data
    depositTotal.value = res.metadata.totalCount
  } catch (err) {
    depositError.value = apiErrorMessage(err)
  } finally {
    depositLoading.value = false
  }
}
watch(depositPage, loadDeposits)
watch(depositPageSize, () => { depositPage.value = 1; loadDeposits() })
watch(depositFilter, () => { depositPage.value === 1 ? loadDeposits() : (depositPage.value = 1) })

// ── Withdrawal report ────────────────────────────────────────────────────
const withdrawalRows = ref<AdminWithdrawal[]>([])
const withdrawalLoading = ref(false)
const withdrawalError = ref('')
const withdrawalPage = ref(1)
const withdrawalPageSize = ref(10)
const withdrawalTotal = ref(0)
const withdrawalColumns: ColumnDef<AdminWithdrawal>[] = [
  { key: 'username', label: 'User', value: (row) => row.username ?? `#${row.userId}` },
  { key: 'amount', type: 'currency' },
  { key: 'feeAmount', label: 'Fee', type: 'currency' },
  { key: 'destination', type: 'text' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]
const withdrawalFilter = reactive<{ startDate?: string; endDate?: string; minAmount?: number; maxAmount?: number }>({})
const withdrawalHasFilter = computed(() => Object.values(withdrawalFilter).some((v) => v !== undefined))
async function loadWithdrawals() {
  withdrawalLoading.value = true
  withdrawalError.value = ''
  try {
    const res = await listAllWithdrawals({
      ...withdrawalFilter,
      page: withdrawalPage.value,
      size: withdrawalPageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    withdrawalRows.value = res.data
    withdrawalTotal.value = res.metadata.totalCount
  } catch (err) {
    withdrawalError.value = apiErrorMessage(err)
  } finally {
    withdrawalLoading.value = false
  }
}
watch(withdrawalPage, loadWithdrawals)
watch(withdrawalPageSize, () => { withdrawalPage.value = 1; loadWithdrawals() })
watch(withdrawalFilter, () => { withdrawalPage.value === 1 ? loadWithdrawals() : (withdrawalPage.value = 1) })

// ── Transfer / Payment report ────────────────────────────────────────────
const transferRows = ref<AdminPayment[]>([])
const transferLoading = ref(false)
const transferError = ref('')
const transferPage = ref(1)
const transferPageSize = ref(10)
const transferTotal = ref(0)
const transferColumns: ColumnDef<AdminPayment>[] = [
  { key: 'payerUsername', label: 'From', value: (row) => row.payerUsername ?? `#${row.payerUserId}` },
  { key: 'payeeUsername', label: 'To', value: (row) => row.payeeUsername ?? `#${row.payeeUserId}` },
  { key: 'amount', type: 'currency' },
  { key: 'feeAmount', label: 'Fee', type: 'currency' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]
const transferFilter = reactive<{ startDate?: string; endDate?: string; minAmount?: number; maxAmount?: number }>({})
const transferHasFilter = computed(() => Object.values(transferFilter).some((v) => v !== undefined))
async function loadTransfers() {
  transferLoading.value = true
  transferError.value = ''
  try {
    const res = await listAllPayments({
      ...transferFilter,
      page: transferPage.value,
      size: transferPageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    transferRows.value = res.data
    transferTotal.value = res.metadata.totalCount
  } catch (err) {
    transferError.value = apiErrorMessage(err)
  } finally {
    transferLoading.value = false
  }
}
watch(transferPage, loadTransfers)
watch(transferPageSize, () => { transferPage.value = 1; loadTransfers() })
watch(transferFilter, () => { transferPage.value === 1 ? loadTransfers() : (transferPage.value = 1) })

// ── Settlement report (successfully-matched deposits) ───────────────────
const settlementRows = ref<AdminDeposit[]>([])
const settlementLoading = ref(false)
const settlementError = ref('')
const settlementPage = ref(1)
const settlementPageSize = ref(10)
const settlementTotal = ref(0)
const settlementColumns: ColumnDef<AdminDeposit>[] = [
  { key: 'username', label: 'User', value: (row) => row.username ?? `#${row.userId}` },
  { key: 'amount', type: 'currency' },
  { key: 'provider', type: 'text' },
  { key: 'providerReference', label: 'Provider reference' },
  { key: 'updatedAt', label: 'Settled at', type: 'datetime', sortable: true }
]
const settlementFilter = reactive<{ startDate?: string; endDate?: string; minAmount?: number; maxAmount?: number }>({})
const settlementHasFilter = computed(() => Object.values(settlementFilter).some((v) => v !== undefined))
async function loadSettlements() {
  settlementLoading.value = true
  settlementError.value = ''
  try {
    const res = await listAllDeposits({
      ...settlementFilter,
      status: 'SUCCESS',
      page: settlementPage.value,
      size: settlementPageSize.value,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    })
    settlementRows.value = res.data
    settlementTotal.value = res.metadata.totalCount
  } catch (err) {
    settlementError.value = apiErrorMessage(err)
  } finally {
    settlementLoading.value = false
  }
}
watch(settlementPage, loadSettlements)
watch(settlementPageSize, () => { settlementPage.value = 1; loadSettlements() })
watch(settlementFilter, () => { settlementPage.value === 1 ? loadSettlements() : (settlementPage.value = 1) })

// ── Fee report ────────────────────────────────────────────────────────────
const feeReport = ref<FeeReport | null>(null)
const feeLoading = ref(false)
const feeError = ref('')
const feeFilter = reactive<FeeReportFilter>({})
async function loadFeeReport() {
  feeLoading.value = true
  feeError.value = ''
  try {
    feeReport.value = await getFeeReport(feeFilter)
  } catch (err) {
    feeError.value = apiErrorMessage(err)
  } finally {
    feeLoading.value = false
  }
}
watch(feeFilter, loadFeeReport)

// ── Merchant report ───────────────────────────────────────────────────────
const merchantRows = ref<MerchantReportEntry[]>([])
const merchantLoading = ref(false)
const merchantError = ref('')
const merchantColumns: ColumnDef<MerchantReportEntry>[] = [
  { key: 'merchantName', label: 'Merchant' },
  { key: 'depositTotal', label: 'Deposits', type: 'currency' },
  { key: 'depositCount', label: 'Deposit count', type: 'number' },
  { key: 'withdrawalTotal', label: 'Withdrawals', type: 'currency' },
  { key: 'withdrawalCount', label: 'Withdrawal count', type: 'number' },
  { key: 'paymentSentTotal', label: 'Payments sent', type: 'currency' },
  { key: 'paymentSentCount', label: 'Payment count', type: 'number' }
]
async function loadMerchants() {
  merchantLoading.value = true
  merchantError.value = ''
  try {
    merchantRows.value = await getMerchantReport()
  } catch (err) {
    merchantError.value = apiErrorMessage(err)
  } finally {
    merchantLoading.value = false
  }
}

const showMerchantTransactions = ref(false)
const selectedMerchantReport = ref<MerchantReportEntry | null>(null)
function openMerchantTransactions(row: MerchantReportEntry) {
  selectedMerchantReport.value = row
  showMerchantTransactions.value = true
}

onMounted(() => {
  loadTx()
  loadDeposits()
  loadWithdrawals()
  loadTransfers()
  loadSettlements()
  loadFeeReport()
  loadMerchants()
})
</script>
