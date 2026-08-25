<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Deposits</h1>
      <UButton icon="i-lucide-plus" @click="showCreate = true">New deposit</UButton>
    </div>

    <UCard class="mb-4">
      <div class="flex flex-wrap items-end gap-3">
        <USelect v-model="filter.status" :items="statusFilterOptions" placeholder="Status" class="w-40" />
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
        :rows="rows"
        :columns="columns"
        :loading="loading"
        refreshable
        numbered
        exportable
        export-filename="my-deposits"
        @refresh="load"
        @select="openDetail"
      />
    </UCard>

    <UModal
      v-model:open="showDetail"
      :title="selectedDeposit ? `${formatCurrency(selectedDeposit.amount)} deposit` : 'Deposit detail'"
    >
      <template #body>
        <DepositPaymentPanel v-if="selectedDeposit" :deposit="selectedDeposit" @update="onDepositUpdate" />
      </template>
    </UModal>

    <DepositCreateModal
      v-model="showCreate"
      :loading="creating"
      :error="createError"
      @submit="onCreateDeposit"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { Deposit, DepositStatus } from '~/composables/useDeposits'

const { listMine, create } = useDeposits()

const rows = ref<Deposit[]>([])
const loading = ref(false)
const error = ref('')

const filter = reactive<{
  status: DepositStatus | undefined
  startDate: string | undefined
  endDate: string | undefined
  minAmount: number | undefined
  maxAmount: number | undefined
}>({ status: undefined, startDate: undefined, endDate: undefined, minAmount: undefined, maxAmount: undefined })
const statusFilterOptions = [
  { label: 'All statuses', value: undefined },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Expired', value: 'EXPIRED' }
]

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

const columns: ColumnDef<Deposit>[] = [
  { key: 'amount', type: 'currency', sortable: true },
  { key: 'status', type: 'status' },
  { key: 'provider' },
  { key: 'createdAt', label: 'Date', type: 'datetime', sortable: true }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listMine({ ...filter, size: 50, sortBy: 'createdAt', sortOrder: 'desc' })
    rows.value = res.data
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const showDetail = ref(false)
const selectedDeposit = ref<Deposit | null>(null)

function openDetail(row: Deposit) {
  selectedDeposit.value = row
  showDetail.value = true
}

async function onCreateDeposit(amount: number) {
  if (!amount || amount <= 0) {
    createError.value = 'Enter an amount greater than zero'
    return
  }
  creating.value = true
  createError.value = ''
  try {
    const deposit = await create(amount)
    showCreate.value = false
    rows.value = [deposit, ...rows.value]
    openDetail(deposit)
  } catch (err) {
    createError.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

function onDepositUpdate(updated: Deposit) {
  selectedDeposit.value = updated
  const idx = rows.value.findIndex((r) => r.id === updated.id)
  if (idx !== -1) rows.value[idx] = updated
}

const route = useRoute()

onMounted(() => {
  load()
  // Supports the Dashboard's "New deposit" quick action (/deposits?new=1).
  if (route.query.new) showCreate.value = true
})
watch(filter, load)
</script>
