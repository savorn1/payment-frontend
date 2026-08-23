<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
      <UButton to="/payments/new" icon="i-lucide-plus">New payment</UButton>
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
      <DataTable
        v-model:sort="sort"
        :rows="rows"
        :columns="columns"
        :loading="loading"
        refreshable
        numbered
        @refresh="load"
      >
        <template #direction-data="{ row }">
          <UBadge :color="row.payerUserId === myUserId ? 'neutral' : 'success'" variant="subtle">
            {{ row.payerUserId === myUserId ? 'Sent' : 'Received' }}
          </UBadge>
        </template>
        <template #counterparty-data="{ row }">
          #{{ row.payerUserId === myUserId ? row.payeeUserId : row.payerUserId }}
        </template>
      </DataTable>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { Payment } from '~/composables/usePayments'

const { listMine } = usePayments()
const { getMine } = useWallet()

const rows = ref<Payment[]>([])
const loading = ref(false)
const error = ref('')
const myUserId = ref<number>()

const sort = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>({
  column: 'createdAt',
  direction: 'desc'
})

const columns: ColumnDef<Payment>[] = [
  { key: 'id', label: 'Reference', sortable: true },
  { key: 'direction', label: 'Direction' },
  { key: 'counterparty', label: 'Counterparty' },
  { key: 'amount', type: 'currency', sortable: true },
  { key: 'feeAmount', label: 'Fee', type: 'currency' },
  { key: 'status', type: 'status' },
  { key: 'description', type: 'text' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [wallet, page] = await Promise.all([
      myUserId.value ? Promise.resolve(undefined) : getMine(),
      listMine({ sortBy: sort.value?.column, sortOrder: sort.value?.direction, size: 50 })
    ])
    if (wallet) myUserId.value = wallet.userId
    rows.value = page.data
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(sort, load)
</script>
