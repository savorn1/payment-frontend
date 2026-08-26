<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment Gateway</h1>

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
        exportable
        export-filename="payment-gateways"
        @refresh="load"
        @select="openDetail"
      >
        <template #empty-state>
          <EmptyState icon="i-lucide-plug-zap" title="No payment gateways configured" description="Payment gateways are provisioned by the platform team." />
        </template>
      </DataTable>
    </UCard>

    <UModal v-model:open="showDetail" :title="selected ? `${selected.providerName} gateway` : 'Gateway detail'" :ui="{ content: 'sm:max-w-4xl' }">
      <template #body>
        <GatewayDetailPanel v-if="selected" :gateway="selected" @updated="onUpdated" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { Gateway } from '~/composables/useGateways'

definePageMeta({ middleware: 'admin' })

const { list } = useGateways()

const rows = ref<Gateway[]>([])
const loading = ref(false)
const error = ref('')

const columns: ColumnDef<Gateway>[] = [
  { key: 'providerName', label: 'Provider' },
  { key: 'enabled', type: 'boolean', trueLabel: 'Enabled', falseLabel: 'Disabled' },
  { key: 'baseUrl', label: 'Base URL' },
  { key: 'updatedAt', label: 'Updated', type: 'datetime' }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await list()
    rows.value = res.data
    if (selected.value) {
      const refreshed = rows.value.find((r) => r.id === selected.value!.id)
      if (refreshed) selected.value = refreshed
    }
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const showDetail = ref(false)
const selected = ref<Gateway | null>(null)

function openDetail(row: Gateway) {
  selected.value = row
  showDetail.value = true
}

function onUpdated(updated: Gateway) {
  selected.value = updated
  const index = rows.value.findIndex((r) => r.id === updated.id)
  if (index !== -1) rows.value[index] = updated
}

onMounted(load)
</script>
