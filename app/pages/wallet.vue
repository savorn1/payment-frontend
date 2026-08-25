<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Wallet</h1>

    <UAlert
      v-if="walletError"
      color="error"
      variant="subtle"
      class="mb-4"
      :title="walletError"
      icon="i-lucide-triangle-alert"
    />

    <WalletMissingPrompt v-else-if="walletMissing" :loading="creatingWallet" @create="onCreateWallet" />

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <StatTile
          label="Available balance"
          :value="formatCurrencyCompact(wallet?.availableBalance)"
          icon="i-lucide-wallet"
          color="primary"
          :loading="walletLoading && !wallet"
        />
        <StatTile
          label="Pending balance"
          :value="formatCurrencyCompact(wallet?.pendingBalance)"
          icon="i-lucide-clock"
          color="warning"
          :loading="walletLoading && !wallet"
        />
      </div>

      <UCard class="mb-4">
        <div class="flex flex-wrap items-end gap-3">
          <UInput
            v-model="filter.search"
            placeholder="Search description or reference"
            icon="i-lucide-search"
            class="w-64"
            @keyup.enter="resetToFirstPage"
          />
          <USelect v-model="filter.type" :items="typeFilterOptions" placeholder="Type" class="w-36" />
          <USelect v-model="filter.status" :items="statusFilterOptions" placeholder="Status" class="w-36" />
          <DateAmountRangeFilter
            v-model:start-date="filter.startDate"
            v-model:end-date="filter.endDate"
            v-model:min-amount="filter.minAmount"
            v-model:max-amount="filter.maxAmount"
          />
        </div>
      </UCard>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        class="mb-4"
        :title="error"
        icon="i-lucide-triangle-alert"
      />

      <UCard>
        <DataTable
          v-model:sort="sort"
          :rows="rows"
          :columns="columns"
          :loading="loading"
          refreshable
          numbered
          exportable
          export-filename="wallet-transactions"
          :row-number-start="(page - 1) * pageSize"
          @refresh="load"
          @select="openDetail"
        />

        <div v-if="total > 0" class="pt-4">
          <DataPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
        </div>
      </UCard>
    </template>

    <TransactionDetailModal v-model="showDetail" :transaction="selectedTransaction" />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { TransactionStatus, TransactionType, WalletTransaction } from '~/composables/useWallet'

const { getMine, createMine, listMyTransactions } = useWallet()

const wallet = ref<Awaited<ReturnType<typeof getMine>>>()
const walletLoading = ref(true)
const creatingWallet = ref(false)
const walletError = ref('')
const walletMissing = ref(false)

async function loadWallet() {
  walletLoading.value = true
  walletError.value = ''
  walletMissing.value = false
  try {
    wallet.value = await getMine()
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      walletMissing.value = true
    } else {
      walletError.value = apiErrorMessage(err)
    }
  } finally {
    walletLoading.value = false
  }
}

async function onCreateWallet() {
  creatingWallet.value = true
  try {
    wallet.value = await createMine()
    walletMissing.value = false
    await load()
  } catch (err) {
    walletError.value = apiErrorMessage(err)
  } finally {
    creatingWallet.value = false
  }
}

const filter = reactive<{
  search: string
  type: TransactionType | undefined
  status: TransactionStatus | undefined
  startDate: string | undefined
  endDate: string | undefined
  minAmount: number | undefined
  maxAmount: number | undefined
}>({
  search: '',
  type: undefined,
  status: undefined,
  startDate: undefined,
  endDate: undefined,
  minAmount: undefined,
  maxAmount: undefined
})

const typeOptions = [
  { label: 'Credit', value: 'CREDIT' },
  { label: 'Debit', value: 'DEBIT' }
]
const typeFilterOptions = [{ label: 'All types', value: undefined }, ...typeOptions]
const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Completed', value: 'COMPLETED' }
]
const statusFilterOptions = [{ label: 'All statuses', value: undefined }, ...statusOptions]

const sort = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>({
  column: 'createdAt',
  direction: 'desc'
})
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const rows = ref<WalletTransaction[]>([])
const loading = ref(false)
const error = ref('')

const columns: ColumnDef<WalletTransaction>[] = [
  { key: 'type', type: 'badge', color: (row) => (row.type === 'CREDIT' ? 'success' : 'neutral') },
  { key: 'amount', type: 'currency', sortable: true },
  { key: 'status', type: 'status' },
  { key: 'description', value: (row) => row.description ?? '—' },
  { key: 'referenceId', label: 'Reference', value: (row) => row.referenceId ?? '—' },
  { key: 'createdAt', label: 'Date', type: 'datetime', sortable: true }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listMyTransactions({
      type: filter.type,
      status: filter.status,
      search: filter.search || undefined,
      startDate: filter.startDate,
      endDate: filter.endDate,
      minAmount: filter.minAmount,
      maxAmount: filter.maxAmount,
      sortBy: sort.value?.column,
      sortOrder: sort.value?.direction,
      page: page.value,
      size: pageSize.value
    })
    rows.value = res.data
    total.value = res.metadata.totalCount
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}

// Filter/sort/page-size changes should jump back to page 1 — but assigning
// page.value here (when it's not already 1) already triggers the page
// watcher's own load() below, so only call load() directly when page was
// already 1 (an assignment to the same value wouldn't trigger that watcher).
function resetToFirstPage() {
  if (page.value === 1) {
    load()
  } else {
    page.value = 1
  }
}

watch(sort, resetToFirstPage)
// search reloads on Enter (see the input's @keyup.enter) rather than live on
// every keystroke — everything else here reloads as soon as it changes.
watch(
  () => [filter.type, filter.status, filter.startDate, filter.endDate, filter.minAmount, filter.maxAmount],
  resetToFirstPage
)
watch(pageSize, resetToFirstPage)
watch(page, load)

const showDetail = ref(false)
const selectedTransaction = ref<WalletTransaction | null>(null)

function openDetail(row: WalletTransaction) {
  selectedTransaction.value = row
  showDetail.value = true
}

onMounted(async () => {
  await loadWallet()
  if (!walletMissing.value && !walletError.value) {
    await load()
  }
})
</script>
