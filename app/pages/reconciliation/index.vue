<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Reconciliation</h1>
      <UButton icon="i-lucide-play" :loading="running" @click="onRunNow">Run reconciliation now</UButton>
    </div>

    <UAlert
      v-if="runResult"
      color="success"
      variant="subtle"
      class="mb-4"
      title="Reconciliation run complete"
      :description="`Checked ${runResult.checked} deposit(s), found ${runResult.mismatchesFound} mismatch(es).`"
      icon="i-lucide-check-circle"
    />
    <UAlert v-if="runError" color="error" variant="subtle" class="mb-4" :title="runError" />

    <UTabs v-model="activeTab" :items="tabItems" class="w-full">
      <template #reports>
        <UCard>
          <UAlert v-if="reportsError" color="error" variant="subtle" class="mb-3" :title="reportsError" />
          <DataTable :rows="runs" :columns="runColumns" :loading="reportsLoading" refreshable @refresh="loadRuns" />
          <div v-if="reportsTotal > 0" class="pt-4">
            <DataPagination v-model:page="reportsPage" v-model:page-size="reportsPageSize" :total="reportsTotal" />
          </div>
        </UCard>
      </template>

      <template #unmatched>
        <UCard>
          <UAlert v-if="unmatchedError" color="error" variant="subtle" class="mb-3" :title="unmatchedError" />
          <DataTable :rows="unmatched" :columns="unmatchedColumns" :loading="unmatchedLoading" refreshable @refresh="loadUnmatched" />
          <div v-if="unmatchedTotal > 0" class="pt-4">
            <DataPagination v-model:page="unmatchedPage" v-model:page-size="unmatchedPageSize" :total="unmatchedTotal" />
          </div>
        </UCard>
      </template>

      <template #settlements>
        <UCard class="mb-4">
          <div class="flex flex-wrap gap-3">
            <USelect v-model="settlementStatus" :items="settlementStatusOptions" placeholder="Status" class="w-40" />
          </div>
        </UCard>
        <UCard>
          <UAlert v-if="settlementsError" color="error" variant="subtle" class="mb-3" :title="settlementsError" />
          <DataTable
            :rows="settlements"
            :columns="settlementColumns"
            :loading="settlementsLoading"
            refreshable
            @refresh="loadSettlements"
          />
          <div v-if="settlementsTotal > 0" class="pt-4">
            <DataPagination v-model:page="settlementsPage" v-model:page-size="settlementsPageSize" :total="settlementsTotal" />
          </div>
        </UCard>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { ReconciliationRun, ReconciliationResult, UnmatchedTransaction } from '~/composables/useReconciliation'
import type { AdminDeposit, DepositStatus } from '~/composables/useDeposits'

definePageMeta({ middleware: 'admin' })

const { runNow, listRuns, listUnmatched } = useReconciliation()
const { listAll: listAllDeposits } = useDeposits()

const activeTab = ref('reports')
const tabItems = [
  { label: 'Reports', icon: 'i-lucide-file-text', slot: 'reports' as const, value: 'reports' },
  { label: 'Unmatched transactions', icon: 'i-lucide-triangle-alert', slot: 'unmatched' as const, value: 'unmatched' },
  { label: 'Settlement records', icon: 'i-lucide-badge-check', slot: 'settlements' as const, value: 'settlements' }
]

// ── Run now ─────────────────────────────────────────────────────────────
const running = ref(false)
const runResult = ref<ReconciliationResult | null>(null)
const runError = ref('')

async function onRunNow() {
  running.value = true
  runError.value = ''
  runResult.value = null
  try {
    runResult.value = await runNow()
    await Promise.all([loadRuns(), loadUnmatched()])
  } catch (err) {
    runError.value = apiErrorMessage(err)
  } finally {
    running.value = false
  }
}

// ── Reports (reconciliation run history) ───────────────────────────────
const runs = ref<ReconciliationRun[]>([])
const reportsLoading = ref(false)
const reportsError = ref('')
const reportsPage = ref(1)
const reportsPageSize = ref(10)
const reportsTotal = ref(0)

const runColumns: ColumnDef<ReconciliationRun>[] = [
  { key: 'checked', type: 'number' },
  { key: 'mismatchesFound', label: 'Mismatches found', type: 'number' },
  { key: 'runAt', label: 'Run at', type: 'datetime' }
]

async function loadRuns() {
  reportsLoading.value = true
  reportsError.value = ''
  try {
    const res = await listRuns({ page: reportsPage.value, size: reportsPageSize.value })
    runs.value = res.data
    reportsTotal.value = res.metadata.totalCount
  } catch (err) {
    reportsError.value = apiErrorMessage(err)
  } finally {
    reportsLoading.value = false
  }
}
watch(reportsPage, loadRuns)
watch(reportsPageSize, () => {
  reportsPage.value = 1
  loadRuns()
})

// ── Unmatched transactions ─────────────────────────────────────────────
const unmatched = ref<UnmatchedTransaction[]>([])
const unmatchedLoading = ref(false)
const unmatchedError = ref('')
const unmatchedPage = ref(1)
const unmatchedPageSize = ref(10)
const unmatchedTotal = ref(0)

const unmatchedColumns: ColumnDef<UnmatchedTransaction>[] = [
  { key: 'targetId', label: 'Deposit', value: (row) => `#${row.targetId}` },
  { key: 'details', type: 'text' },
  { key: 'createdAt', label: 'Detected', type: 'datetime' }
]

async function loadUnmatched() {
  unmatchedLoading.value = true
  unmatchedError.value = ''
  try {
    const res = await listUnmatched({ page: unmatchedPage.value, size: unmatchedPageSize.value })
    unmatched.value = res.data
    unmatchedTotal.value = res.metadata.totalCount
  } catch (err) {
    unmatchedError.value = apiErrorMessage(err)
  } finally {
    unmatchedLoading.value = false
  }
}
watch(unmatchedPage, loadUnmatched)
watch(unmatchedPageSize, () => {
  unmatchedPage.value = 1
  loadUnmatched()
})

// ── Settlement records (successfully-matched deposits) ─────────────────
const settlements = ref<AdminDeposit[]>([])
const settlementsLoading = ref(false)
const settlementsError = ref('')
const settlementsPage = ref(1)
const settlementsPageSize = ref(10)
const settlementsTotal = ref(0)
const settlementStatus = ref<DepositStatus | undefined>('SUCCESS')
const settlementStatusOptions = [
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'All statuses', value: undefined }
]

const settlementColumns: ColumnDef<AdminDeposit>[] = [
  { key: 'username', label: 'User', value: (row) => row.username ?? `#${row.userId}` },
  { key: 'amount', type: 'currency' },
  { key: 'provider', type: 'text' },
  { key: 'providerReference', label: 'Provider reference' },
  { key: 'status', type: 'status' },
  { key: 'updatedAt', label: 'Settled at', type: 'datetime' }
]

async function loadSettlements() {
  settlementsLoading.value = true
  settlementsError.value = ''
  try {
    const res = await listAllDeposits({
      status: settlementStatus.value,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: settlementsPage.value,
      size: settlementsPageSize.value
    })
    settlements.value = res.data
    settlementsTotal.value = res.metadata.totalCount
  } catch (err) {
    settlementsError.value = apiErrorMessage(err)
  } finally {
    settlementsLoading.value = false
  }
}
watch(settlementsPage, loadSettlements)
watch(settlementsPageSize, () => {
  settlementsPage.value = 1
  loadSettlements()
})
watch(settlementStatus, () => {
  settlementsPage.value = 1
  loadSettlements()
})

onMounted(() => {
  loadRuns()
  loadUnmatched()
  loadSettlements()
})
</script>
