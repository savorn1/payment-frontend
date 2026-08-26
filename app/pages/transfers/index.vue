<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Transfer Management</h1>

    <UCard class="mb-4">
      <div class="flex flex-wrap items-end gap-3">
        <USelectMenu
          v-model="selectedUserId"
          v-model:search-term="userQuery"
          value-key="value"
          :items="userOptions"
          :loading="searchingUsers"
          clear
          placeholder="Search by username"
          icon="i-lucide-search"
          class="w-56"
        />
        <USelect v-model="filter.status" :items="statusFilterOptions" placeholder="Status" class="w-40" />
        <DateAmountRangeFilter
          v-model:start-date="filter.startDate"
          v-model:end-date="filter.endDate"
          v-model:min-amount="filter.minAmount"
          v-model:max-amount="filter.maxAmount"
          hide-clear
        />
        <UButton
          v-if="hasActiveFilter"
          size="sm"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          @click="clearFilters"
        >
          Clear filters
        </UButton>
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
        export-filename="transfer-management"
        :row-number-start="(page - 1) * pageSize"
        @refresh="load"
        @select="openDetail"
      >
        <template #empty-state>
          <EmptyState
            v-if="hasActiveFilter"
            icon="i-lucide-search-x"
            title="No transfers match your filters"
            description="Try a different search or clear your filters."
          >
            <template #action>
              <UButton color="neutral" variant="soft" icon="i-lucide-x" @click="clearFilters">Clear filters</UButton>
            </template>
          </EmptyState>
          <EmptyState v-else icon="i-lucide-arrow-left-right" title="No transfers yet" description="Payments between users will show up here." />
        </template>
      </DataTable>

      <div v-if="total > 0" class="pt-4">
        <DataPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
      </div>
    </UCard>

    <UModal
      v-model:open="showDetail"
      :title="selectedPayment ? `${formatCurrency(selectedPayment.amount)} transfer` : 'Transfer detail'"
    >
      <template #body>
        <AdminTransferDetailPanel v-if="selectedPayment" :payment="selectedPayment" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { AdminPayment, PaymentStatus } from '~/composables/usePayments'
import type { AdminUser } from '~/composables/useUsers'

definePageMeta({ middleware: 'admin' })

const { listAll } = usePayments()
const { list: listUsers } = useUsers()

const rows = ref<AdminPayment[]>([])
const loading = ref(false)
const error = ref('')

const filter = reactive<{
  status: PaymentStatus | undefined
  startDate: string | undefined
  endDate: string | undefined
  minAmount: number | undefined
  maxAmount: number | undefined
}>({ status: undefined, startDate: undefined, endDate: undefined, minAmount: undefined, maxAmount: undefined })
const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failed', value: 'FAILED' }
]
const statusFilterOptions = [{ label: 'All statuses', value: undefined }, ...statusOptions]

// User filter — same search-as-you-type combobox as MerchantCreateModal's
// user picker, backed by the admin user list (unlike the payments recipient
// search, this doesn't exclude the caller and supports an empty query).
const userQuery = ref('')
const users = ref<AdminUser[]>([])
const searchingUsers = ref(false)
const selectedUserId = ref<number | undefined>()
const userOptions = computed(() => users.value.map((u) => ({ label: u.username, value: u.id })))

async function fetchUsers(query: string) {
  searchingUsers.value = true
  try {
    const res = await listUsers({ username: query.trim() || undefined, size: 10 })
    users.value = res.data
  } catch {
    users.value = []
  } finally {
    searchingUsers.value = false
  }
}

let userDebounce: ReturnType<typeof setTimeout> | undefined
watch(userQuery, (query) => {
  if (userDebounce) clearTimeout(userDebounce)
  userDebounce = setTimeout(() => fetchUsers(query), 300)
})

const hasActiveFilter = computed(
  () =>
    selectedUserId.value !== undefined ||
    filter.status !== undefined ||
    filter.startDate !== undefined ||
    filter.endDate !== undefined ||
    filter.minAmount !== undefined ||
    filter.maxAmount !== undefined
)

function clearFilters() {
  selectedUserId.value = undefined
  filter.status = undefined
  filter.startDate = undefined
  filter.endDate = undefined
  filter.minAmount = undefined
  filter.maxAmount = undefined
}

const sort = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>({
  column: 'createdAt',
  direction: 'desc'
})
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const columns: ColumnDef<AdminPayment>[] = [
  { key: 'payerUsername', label: 'From', value: (row) => row.payerUsername ?? `#${row.payerUserId}` },
  { key: 'payeeUsername', label: 'To', value: (row) => row.payeeUsername ?? `#${row.payeeUserId}` },
  { key: 'amount', type: 'currency', sortable: true },
  { key: 'feeAmount', label: 'Fee', type: 'currency' },
  { key: 'status', type: 'status' },
  { key: 'description', type: 'text', class: 'max-w-xs' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listAll({
      ...filter,
      userId: selectedUserId.value,
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

function resetToFirstPage() {
  if (page.value === 1) {
    load()
  } else {
    page.value = 1
  }
}

watch(sort, resetToFirstPage)
watch(
  () => [filter.status, filter.startDate, filter.endDate, filter.minAmount, filter.maxAmount, selectedUserId.value],
  resetToFirstPage
)
watch(pageSize, resetToFirstPage)
watch(page, load)

const showDetail = ref(false)
const selectedPayment = ref<AdminPayment | null>(null)

function openDetail(row: AdminPayment) {
  selectedPayment.value = row
  showDetail.value = true
}

onMounted(() => {
  load()
  fetchUsers('')
})
</script>
