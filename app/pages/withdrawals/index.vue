<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Withdrawals</h1>
      <UButton icon="i-lucide-plus" @click="showCreate = true">New withdrawal</UButton>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      class="mb-4"
      :title="error"
      icon="i-lucide-triangle-alert"
    />

    <UCard>
      <DataTable :rows="rows" :columns="columns" :loading="loading" refreshable numbered @refresh="load" @select="openDetail" />
    </UCard>

    <UModal
      v-model:open="showDetail"
      :title="selectedWithdrawal ? `${formatCurrency(selectedWithdrawal.amount)} withdrawal` : 'Withdrawal detail'"
    >
      <template #body>
        <WithdrawalStatusPanel v-if="selectedWithdrawal" :withdrawal="selectedWithdrawal" />
      </template>
    </UModal>

    <WithdrawalCreateModal
      v-model="showCreate"
      :loading="creating"
      :error="createError"
      @submit="onCreateWithdrawal"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { Withdrawal } from '~/composables/useWithdrawals'

const { listMine, create } = useWithdrawals()

const rows = ref<Withdrawal[]>([])
const loading = ref(false)
const error = ref('')

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

const columns: ColumnDef<Withdrawal>[] = [
  { key: 'amount', type: 'currency', sortable: true },
  { key: 'feeAmount', label: 'Fee', type: 'currency' },
  { key: 'destination' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Date', type: 'datetime', sortable: true }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listMine({ size: 50, sortBy: 'createdAt', sortOrder: 'desc' })
    rows.value = res.data
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const showDetail = ref(false)
const selectedWithdrawal = ref<Withdrawal | null>(null)

function openDetail(row: Withdrawal) {
  selectedWithdrawal.value = row
  showDetail.value = true
}

async function onCreateWithdrawal(payload: { amount: number; destination: string }) {
  creating.value = true
  createError.value = ''
  try {
    const withdrawal = await create(payload)
    showCreate.value = false
    rows.value = [withdrawal, ...rows.value]
    openDetail(withdrawal)
  } catch (err) {
    createError.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

const route = useRoute()

onMounted(() => {
  load()
  // Supports the Dashboard's "New withdrawal" quick action (/withdrawals?new=1).
  if (route.query.new) showCreate.value = true
})
</script>
