<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

    <UAlert
      v-if="error && !walletMissing"
      color="error"
      variant="subtle"
      class="mb-4"
      :title="error"
      icon="i-lucide-triangle-alert"
    />

    <div v-else-if="walletMissing" class="rounded-xl border border-gray-200 dark:border-gray-800 p-5 max-w-xs">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        You don't have a wallet yet.
      </p>
      <UButton size="sm" :loading="creating" @click="onCreateWallet">Create wallet</UButton>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total balance"
          :value="formatCurrency(summary?.walletBalance)"
          :sublabel="summary ? `${formatCurrency(summary.pendingBalance)} pending` : undefined"
          icon="i-lucide-wallet"
        />
        <StatTile
          label="Total deposits"
          :value="formatCurrency(summary?.totalDeposits)"
          :sublabel="summary ? countLabel(summary.depositCount, 'deposit') : undefined"
          icon="i-lucide-arrow-down-to-line"
        />
        <StatTile
          label="Total withdrawals"
          :value="formatCurrency(summary?.totalWithdrawals)"
          :sublabel="summary ? countLabel(summary.withdrawalCount, 'withdrawal') : undefined"
          icon="i-lucide-arrow-up-from-line"
        />
        <StatTile
          label="Total transfers"
          :value="formatCurrency(transferTotal)"
          :sublabel="summary ? countLabel(summary.transferCount, 'transfer') : undefined"
          icon="i-lucide-arrow-left-right"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-bar-chart-3" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Transaction statistics
              </h2>
            </div>
          </template>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Credits (money in)</p>
              <p class="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {{ formatCurrency(summary?.transactionStats.totalCredited) }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {{ countLabel(summary?.transactionStats.creditCount ?? 0, 'transaction') }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Debits (money out)</p>
              <p class="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                {{ formatCurrency(summary?.transactionStats.totalDebited) }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {{ countLabel(summary?.transactionStats.debitCount ?? 0, 'transaction') }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-pie-chart" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Payment status summary
              </h2>
            </div>
          </template>
          <template v-if="totalPayments > 0">
            <div class="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-4 bg-gray-100 dark:bg-gray-800">
              <div
                v-if="summary!.paymentStatusSummary.pendingCount"
                class="bg-warning"
                :style="{ flexGrow: summary!.paymentStatusSummary.pendingCount }"
              />
              <div
                v-if="summary!.paymentStatusSummary.successCount"
                class="bg-success"
                :style="{ flexGrow: summary!.paymentStatusSummary.successCount }"
              />
              <div
                v-if="summary!.paymentStatusSummary.failedCount"
                class="bg-error"
                :style="{ flexGrow: summary!.paymentStatusSummary.failedCount }"
              />
            </div>
            <div class="space-y-2">
              <div v-for="row in paymentStatusRows" :key="row.label" class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <UIcon :name="row.icon" class="w-3.5 h-3.5" :class="row.textClass" />
                  {{ row.label }}
                </span>
                <span class="font-medium text-gray-900 dark:text-white">{{ row.count }}</span>
              </div>
            </div>
          </template>
          <EmptyState v-else icon="i-lucide-inbox" title="No payments yet" />
        </UCard>
      </div>

      <UCard class="mt-4">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-history" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Recent transactions
            </h2>
          </div>
        </template>
        <DataTable :rows="summary?.recentTransactions ?? []" :columns="transactionColumns" :loading="loading" />
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { WalletTransactionEntry } from '~/composables/useDashboard'

const { getSummary } = useDashboard()
const { createMine } = useWallet()

const summary = ref<Awaited<ReturnType<typeof getSummary>>>()
const loading = ref(true)
const creating = ref(false)
const error = ref('')
const walletMissing = ref(false)

async function loadSummary() {
  loading.value = true
  error.value = ''
  walletMissing.value = false
  try {
    summary.value = await getSummary()
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      walletMissing.value = true
    } else {
      error.value = apiErrorMessage(err)
    }
  } finally {
    loading.value = false
  }
}

async function onCreateWallet() {
  creating.value = true
  try {
    await createMine()
    walletMissing.value = false
    await loadSummary()
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

const transferTotal = computed(() =>
  summary.value ? summary.value.totalTransfersSent + summary.value.totalTransfersReceived : undefined
)

const totalPayments = computed(() => {
  const s = summary.value?.paymentStatusSummary
  return s ? s.pendingCount + s.successCount + s.failedCount : 0
})

const paymentStatusRows = computed(() => [
  {
    label: 'Pending',
    count: summary.value?.paymentStatusSummary.pendingCount ?? 0,
    icon: 'i-lucide-clock',
    textClass: 'text-warning'
  },
  {
    label: 'Success',
    count: summary.value?.paymentStatusSummary.successCount ?? 0,
    icon: 'i-lucide-check-circle',
    textClass: 'text-success'
  },
  {
    label: 'Failed',
    count: summary.value?.paymentStatusSummary.failedCount ?? 0,
    icon: 'i-lucide-x-circle',
    textClass: 'text-error'
  }
])

function countLabel(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

const transactionColumns: ColumnDef<WalletTransactionEntry>[] = [
  { key: 'type', type: 'badge', color: (row) => (row.type === 'CREDIT' ? 'success' : 'neutral') },
  { key: 'amount', type: 'currency' },
  { key: 'status', type: 'status' },
  { key: 'description', value: (row) => row.description ?? '—' },
  { key: 'createdAt', label: 'Date', type: 'datetime' }
]

onMounted(loadSummary)
</script>
