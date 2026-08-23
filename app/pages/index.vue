<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Welcome back{{ username ? `, ${username}` : '' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-refresh-cw" variant="ghost" color="neutral" :loading="loading" @click="loadSummary">
          Refresh
        </UButton>
        <UButton to="/deposits?new=1" icon="i-lucide-arrow-down-to-line" variant="soft" color="neutral">
          New deposit
        </UButton>
        <UButton to="/withdrawals?new=1" icon="i-lucide-arrow-up-from-line" variant="soft" color="neutral">
          New withdrawal
        </UButton>
        <UButton to="/payments?new=1" icon="i-lucide-plus">New payment</UButton>
      </div>
    </div>

    <UAlert
      v-if="error && !walletMissing"
      color="error"
      variant="subtle"
      class="mb-4"
      :title="error"
      icon="i-lucide-triangle-alert"
    />

    <WalletMissingPrompt v-else-if="walletMissing" :loading="creating" @create="onCreateWallet" />

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total balance"
          :value="formatCurrencyCompact(summary?.walletBalance)"
          :sublabel="summary ? `${formatCurrencyCompact(summary.pendingBalance)} pending` : undefined"
          icon="i-lucide-wallet"
          color="primary"
          to="/wallet"
          :loading="loading && !summary"
        />
        <StatTile
          label="Total deposits"
          :value="formatCurrencyCompact(summary?.totalDeposits)"
          :sublabel="summary ? countLabel(summary.depositCount, 'deposit') : undefined"
          icon="i-lucide-arrow-down-to-line"
          color="success"
          to="/deposits"
          :loading="loading && !summary"
        />
        <StatTile
          label="Total withdrawals"
          :value="formatCurrencyCompact(summary?.totalWithdrawals)"
          :sublabel="summary ? countLabel(summary.withdrawalCount, 'withdrawal') : undefined"
          icon="i-lucide-arrow-up-from-line"
          color="warning"
          to="/withdrawals"
          :loading="loading && !summary"
        />
        <StatTile
          label="Total transfers"
          :value="formatCurrencyCompact(transferTotal)"
          :sublabel="summary ? countLabel(summary.transferCount, 'transfer') : undefined"
          icon="i-lucide-arrow-left-right"
          color="info"
          to="/payments"
          :loading="loading && !summary"
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
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-activity" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Activity (last 30 days)
              </h2>
            </div>
            <span v-if="activity.length > 0" class="text-xs text-gray-400 dark:text-gray-500">
              {{ formatCurrency(activityTotals.credited) }} in · {{ formatCurrency(activityTotals.debited) }} out
            </span>
          </div>
        </template>
        <ActivityChart v-if="activity.length > 0" :points="activity" />
        <EmptyState v-else icon="i-lucide-activity" title="No activity yet" />
      </UCard>

      <UCard class="mt-4">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-history" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recent transactions
              </h2>
            </div>
            <UButton to="/wallet" size="xs" variant="link" color="neutral" trailing-icon="i-lucide-arrow-right">
              View all
            </UButton>
          </div>
        </template>
        <DataTable :rows="summary?.recentTransactions ?? []" :columns="transactionColumns" :loading="loading" />
      </UCard>
    </template>

    <template v-if="isAdmin && platform">
      <div class="flex items-center gap-2 mt-8 mb-4 pt-6 border-t border-gray-200 dark:border-gray-800">
        <UIcon name="i-lucide-globe" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Platform overview</h2>
        <span class="text-sm text-gray-400 dark:text-gray-500">
          — across all {{ countLabel(platform.totalUsers, 'user') }}
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total users"
          :value="String(platform.totalUsers)"
          icon="i-lucide-users"
          color="neutral"
          to="/users"
        />
        <StatTile
          label="Platform balance"
          :value="formatCurrencyCompact(platform.totalWalletBalance)"
          icon="i-lucide-landmark"
          color="primary"
        />
        <StatTile
          label="Total deposits"
          :value="formatCurrencyCompact(platform.totalDeposits)"
          :sublabel="countLabel(platform.depositCount, 'deposit')"
          icon="i-lucide-arrow-down-to-line"
          color="success"
        />
        <StatTile
          label="Total transfers"
          :value="formatCurrencyCompact(platform.totalTransfers)"
          :sublabel="countLabel(platform.transferCount, 'transfer')"
          icon="i-lucide-arrow-left-right"
          color="info"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { DailyActivityPoint, WalletTransactionEntry } from '~/composables/useDashboard'

const { getSummary, getActivity, getPlatformSummary } = useDashboard()
const { createMine } = useWallet()
const { isAdmin, username } = useAuth()

const summary = ref<Awaited<ReturnType<typeof getSummary>>>()
const activity = ref<DailyActivityPoint[]>([])
const platform = ref<Awaited<ReturnType<typeof getPlatformSummary>>>()
const loading = ref(true)
const creating = ref(false)
const error = ref('')
const walletMissing = ref(false)

async function loadSummary() {
  loading.value = true
  error.value = ''
  walletMissing.value = false
  try {
    const [summaryRes, activityRes] = await Promise.all([getSummary(), getActivity(30)])
    summary.value = summaryRes
    activity.value = activityRes
    if (isAdmin.value) platform.value = await getPlatformSummary()
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

const activityTotals = computed(() =>
  activity.value.reduce(
    (totals, point) => ({
      credited: totals.credited + point.credited,
      debited: totals.debited + point.debited
    }),
    { credited: 0, debited: 0 }
  )
)

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
