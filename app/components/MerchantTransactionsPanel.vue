<template>
  <UTabs v-model="activeTab" :items="tabItems" class="w-full">
    <template #deposits>
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
          :export-filename="`${merchant.merchantName}-deposits`"
          @refresh="loadDeposits"
        />
        <div v-if="depositTotal > 0" class="pt-4">
          <DataPagination v-model:page="depositPage" v-model:page-size="depositPageSize" :total="depositTotal" />
        </div>
      </UCard>
    </template>

    <template #withdrawals>
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
          :export-filename="`${merchant.merchantName}-withdrawals`"
          @refresh="loadWithdrawals"
        />
        <div v-if="withdrawalTotal > 0" class="pt-4">
          <DataPagination v-model:page="withdrawalPage" v-model:page-size="withdrawalPageSize" :total="withdrawalTotal" />
        </div>
      </UCard>
    </template>

    <template #payments>
      <UCard class="mb-4">
        <div class="flex flex-wrap items-end gap-3">
          <DateAmountRangeFilter
            v-model:start-date="paymentFilter.startDate"
            v-model:end-date="paymentFilter.endDate"
            v-model:min-amount="paymentFilter.minAmount"
            v-model:max-amount="paymentFilter.maxAmount"
          />
        </div>
        <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <USwitch v-model="showAllPayments" />
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Show received &amp; non-completed payments too
          </span>
        </div>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{
            showAllPayments
              ? 'Showing every payment in either direction, any status.'
              : "Matches the Merchant report's payment count — sent, successful only."
          }}
        </p>
      </UCard>
      <UCard>
        <UAlert v-if="paymentError" color="error" variant="subtle" class="mb-3" :title="paymentError" />
        <DataTable
          :rows="paymentRows"
          :columns="paymentColumns"
          :loading="paymentLoading"
          refreshable
          exportable
          :export-filename="`${merchant.merchantName}-payments`"
          @refresh="loadPayments"
        >
          <template #direction-data="{ row }">
            <UBadge :color="row.payerUserId === merchant.userId ? 'neutral' : 'success'" variant="subtle">
              {{ row.payerUserId === merchant.userId ? 'Sent' : 'Received' }}
            </UBadge>
          </template>
          <template #counterparty-data="{ row }">
            {{
              row.payerUserId === merchant.userId
                ? (row.payeeUsername ?? `#${row.payeeUserId}`)
                : (row.payerUsername ?? `#${row.payerUserId}`)
            }}
          </template>
        </DataTable>
        <div v-if="paymentTotal > 0" class="pt-4">
          <DataPagination v-model:page="paymentPage" v-model:page-size="paymentPageSize" :total="paymentTotal" />
        </div>
      </UCard>
    </template>
  </UTabs>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { MerchantReportEntry } from '~/composables/useReports'
import type { AdminDeposit } from '~/composables/useDeposits'
import type { AdminWithdrawal } from '~/composables/useWithdrawals'
import type { AdminPayment } from '~/composables/usePayments'

const props = defineProps<{ merchant: MerchantReportEntry }>()

const { listAll: listAllDeposits } = useDeposits()
const { listAll: listAllWithdrawals } = useWithdrawals()
const { listAll: listAllPayments } = usePayments()

const activeTab = ref('deposits')
const tabItems = [
  { label: 'Deposits', icon: 'i-lucide-arrow-down-to-line', slot: 'deposits' as const, value: 'deposits' },
  { label: 'Withdrawals', icon: 'i-lucide-arrow-up-from-line', slot: 'withdrawals' as const, value: 'withdrawals' },
  { label: 'Payments', icon: 'i-lucide-arrow-left-right', slot: 'payments' as const, value: 'payments' }
]

type RangeFilter = { startDate?: string; endDate?: string; minAmount?: number; maxAmount?: number }

// ── Deposits ──────────────────────────────────────────────────────────────
const depositRows = ref<AdminDeposit[]>([])
const depositLoading = ref(false)
const depositError = ref('')
const depositPage = ref(1)
const depositPageSize = ref(10)
const depositTotal = ref(0)
const depositFilter = reactive<RangeFilter>({})
const depositColumns: ColumnDef<AdminDeposit>[] = [
  { key: 'amount', type: 'currency' },
  { key: 'provider', type: 'text' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]
async function loadDeposits() {
  depositLoading.value = true
  depositError.value = ''
  try {
    const res = await listAllDeposits({
      userId: props.merchant.userId,
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

// ── Withdrawals ───────────────────────────────────────────────────────────
const withdrawalRows = ref<AdminWithdrawal[]>([])
const withdrawalLoading = ref(false)
const withdrawalError = ref('')
const withdrawalPage = ref(1)
const withdrawalPageSize = ref(10)
const withdrawalTotal = ref(0)
const withdrawalFilter = reactive<RangeFilter>({})
const withdrawalColumns: ColumnDef<AdminWithdrawal>[] = [
  { key: 'amount', type: 'currency' },
  { key: 'feeAmount', label: 'Fee', type: 'currency' },
  { key: 'destination', type: 'text' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]
async function loadWithdrawals() {
  withdrawalLoading.value = true
  withdrawalError.value = ''
  try {
    const res = await listAllWithdrawals({
      userId: props.merchant.userId,
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

// ── Payments ──────────────────────────────────────────────────────────────
// Default (showAllPayments = false) scopes to payerUserId + SUCCESS, the
// exact same criteria the Merchant report's paymentSentCount/paymentSentTotal
// use — so "0" there reliably means an empty list here too. Toggling on
// broadens to the admin filter's userId (matches payer OR payee, any
// status), which is why the Direction badge exists at all.
const paymentRows = ref<AdminPayment[]>([])
const paymentLoading = ref(false)
const paymentError = ref('')
const paymentPage = ref(1)
const paymentPageSize = ref(10)
const paymentTotal = ref(0)
const paymentFilter = reactive<RangeFilter>({})
const showAllPayments = ref(false)
const paymentColumns: ColumnDef<AdminPayment>[] = [
  { key: 'direction', label: 'Direction' },
  { key: 'counterparty', label: 'Counterparty' },
  { key: 'amount', type: 'currency' },
  { key: 'feeAmount', label: 'Fee', type: 'currency' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]
async function loadPayments() {
  paymentLoading.value = true
  paymentError.value = ''
  try {
    const scope = showAllPayments.value
      ? { userId: props.merchant.userId }
      : { payerUserId: props.merchant.userId, status: 'SUCCESS' as const }
    const res = await listAllPayments({
      ...scope,
      ...paymentFilter,
      page: paymentPage.value,
      size: paymentPageSize.value,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    paymentRows.value = res.data
    paymentTotal.value = res.metadata.totalCount
  } catch (err) {
    paymentError.value = apiErrorMessage(err)
  } finally {
    paymentLoading.value = false
  }
}
watch(paymentPage, loadPayments)
watch(paymentPageSize, () => { paymentPage.value = 1; loadPayments() })
watch(paymentFilter, () => { paymentPage.value === 1 ? loadPayments() : (paymentPage.value = 1) })
watch(showAllPayments, () => { paymentPage.value === 1 ? loadPayments() : (paymentPage.value = 1) })

onMounted(() => {
  loadDeposits()
  loadWithdrawals()
  loadPayments()
})
</script>
