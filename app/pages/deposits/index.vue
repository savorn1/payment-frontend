<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Deposits</h1>
      <UButton icon="i-lucide-plus" @click="showCreate = true">New deposit</UButton>
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
import type { Deposit } from '~/composables/useDeposits'

const { listMine, create } = useDeposits()

const rows = ref<Deposit[]>([])
const loading = ref(false)
const error = ref('')

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
    const res = await listMine({ size: 50, sortBy: 'createdAt', sortOrder: 'desc' })
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

onMounted(load)
</script>
