<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
      <UButton icon="i-lucide-plus" @click="showCreate = true">New payment</UButton>
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
        @select="openDetail"
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

    <UModal
      v-model:open="showDetail"
      :title="selectedPayment ? `${formatCurrency(selectedPayment.amount)} transfer` : 'Transfer detail'"
    >
      <template #body>
        <PaymentDetailPanel v-if="selectedPayment" :payment="selectedPayment" :my-user-id="myUserId" />
      </template>
    </UModal>

    <PaymentCreateModal
      v-model="showCreate"
      :loading="creating"
      :error="createError"
      @submit="onCreatePayment"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { Payment } from '~/composables/usePayments'

const { listMine, create } = usePayments()
const { getMine } = useWallet()

const rows = ref<Payment[]>([])
const loading = ref(false)
const error = ref('')
const myUserId = ref<number>()

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

const showDetail = ref(false)
const selectedPayment = ref<Payment | null>(null)

function openDetail(row: Payment) {
  selectedPayment.value = row
  showDetail.value = true
}

const sort = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>({
  column: 'createdAt',
  direction: 'desc'
})

const columns: ColumnDef<Payment>[] = [
  // { key: 'id', label: 'Reference', sortable: true },
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

async function onCreatePayment(payload: { payeeUserId: number; amount: number; description?: string }) {
  creating.value = true
  createError.value = ''
  try {
    const payment = await create(payload)
    showCreate.value = false
    rows.value = [payment, ...rows.value]
    openDetail(payment)
  } catch (err) {
    createError.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

const route = useRoute()

onMounted(() => {
  load()
  // Supports the Dashboard's "New payment" quick action (/payments?new=1).
  if (route.query.new) showCreate.value = true
})
watch(sort, load)
</script>
