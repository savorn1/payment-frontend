<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Merchant Management</h1>
      <UButton icon="i-lucide-plus" @click="showCreate = true">New merchant</UButton>
    </div>

    <UCard class="mb-4">
      <div class="flex flex-wrap gap-3">
        <UInput
          v-model="filter.name"
          placeholder="Search merchant name"
          icon="i-lucide-search"
          class="w-56"
          @keyup.enter="resetToFirstPage"
        />
        <USelect v-model="filter.status" :items="statusFilterOptions" placeholder="Status" class="w-40" />
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
        export-filename="merchants"
        :row-number-start="(page - 1) * pageSize"
        @refresh="load"
        @select="openDetail"
      >
        <template #empty-state>
          <EmptyState
            v-if="hasActiveFilter"
            icon="i-lucide-search-x"
            title="No merchants match your filters"
            description="Try a different search or clear your filters."
          >
            <template #action>
              <UButton color="neutral" variant="soft" icon="i-lucide-x" @click="clearFilters">Clear filters</UButton>
            </template>
          </EmptyState>
          <EmptyState v-else icon="i-lucide-store" title="No merchants yet" description="Get started by registering your first merchant.">
            <template #action>
              <UButton icon="i-lucide-plus" @click="showCreate = true">New merchant</UButton>
            </template>
          </EmptyState>
        </template>
      </DataTable>

      <div v-if="total > 0" class="pt-4">
        <DataPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
      </div>
    </UCard>

    <UModal
      v-model:open="showDetail"
      :title="selected ? selected.name : 'Merchant detail'"
      :ui="{ content: 'sm:max-w-5xl' }"
    >
      <template #body>
        <MerchantDetailPanel v-if="selected" :merchant="selected" @updated="onUpdated" />
      </template>
    </UModal>

    <MerchantCreateModal
      v-model="showCreate"
      :loading="creating"
      :error="createError"
      @submit="onCreate"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { Merchant, MerchantStatus } from '~/composables/useMerchants'

definePageMeta({ middleware: 'admin' })

const { list, create } = useMerchants()
const toast = useToast()

const rows = ref<Merchant[]>([])
const loading = ref(false)
const error = ref('')

const filter = reactive<{ name: string; status: MerchantStatus | undefined }>({
  name: '',
  status: undefined
})
const statusFilterOptions = [
  { label: 'All statuses', value: undefined },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' }
]

const sort = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>({
  column: 'id',
  direction: 'desc'
})
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const columns: ColumnDef<Merchant>[] = [
  { key: 'name', sortable: true },
  { key: 'userId', label: 'User', value: (row) => `#${row.userId}` },
  { key: 'status', type: 'status' },
  { key: 'webhookUrl', label: 'Webhook URL', value: (row) => row.webhookUrl ?? '—' },
  { key: 'createdAt', label: 'Created', type: 'datetime', sortable: true }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await list({
      name: filter.name || undefined,
      status: filter.status,
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
watch(() => [filter.status], resetToFirstPage)
watch(pageSize, resetToFirstPage)
watch(page, load)

const hasActiveFilter = computed(() => filter.name !== '' || filter.status !== undefined)

function clearFilters() {
  filter.name = ''
  filter.status = undefined
  // `name` alone isn't in the reactive watch above (it only reloads on
  // Enter), so clearing it without touching status wouldn't otherwise
  // trigger a reload — call explicitly to cover that case.
  resetToFirstPage()
}

const showDetail = ref(false)
const selected = ref<Merchant | null>(null)

function openDetail(row: Merchant) {
  selected.value = row
  showDetail.value = true
}

function onUpdated(updated: Merchant) {
  selected.value = updated
  const index = rows.value.findIndex((r) => r.id === updated.id)
  if (index !== -1) rows.value[index] = updated
}

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

async function onCreate(payload: { userId: number; name: string }) {
  creating.value = true
  createError.value = ''
  try {
    await create(payload)
    showCreate.value = false
    toast.add({ title: 'Merchant created', color: 'success' })
    await load()
  } catch (err) {
    createError.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>
