<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Webhook Management</h1>

    <UCard class="mb-4">
      <div class="flex flex-wrap gap-3">
        <USelectMenu
          v-model="selectedMerchantId"
          v-model:search-term="merchantQuery"
          value-key="value"
          :items="merchantOptions"
          :loading="searchingMerchants"
          clear
          placeholder="Search by merchant name"
          icon="i-lucide-search"
          class="w-56"
        />
        <USelect v-model="filter.eventType" :items="eventTypeFilterOptions" placeholder="Event type" class="w-44" />
        <USelect v-model="filter.success" :items="statusFilterOptions" placeholder="Status" class="w-40" />
      </div>
    </UCard>

    <UCard v-if="selectedMerchant" class="mb-4">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-webhook" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Webhook configuration — {{ selectedMerchant.label }}
          </h2>
        </div>
      </template>

      <div v-if="configLoading" class="flex justify-center py-6">
        <UIcon name="i-lucide-loader-circle" class="w-5 h-5 text-gray-400 animate-spin" />
      </div>
      <UAlert v-else-if="configError" color="error" variant="subtle" :title="configError" />
      <template v-else-if="webhookConfig">
        <DynamicForm
          v-if="editingConfig"
          v-model="configForm"
          :fields="configFields"
          :loading="savingConfig"
          :error="saveConfigError"
          submit-label="Save"
          cancelable
          @submit="onSaveConfig"
          @cancel="editingConfig = false"
        />
        <div v-else class="flex items-center justify-between">
          <dl class="text-sm space-y-1">
            <div>
              <dt class="inline text-gray-500 dark:text-gray-400">URL: </dt>
              <dd class="inline font-medium text-gray-900 dark:text-white">{{ webhookConfig.webhookUrl ?? 'Not configured' }}</dd>
            </div>
            <div>
              <dt class="inline text-gray-500 dark:text-gray-400">Secret: </dt>
              <dd class="inline font-mono text-gray-900 dark:text-white">{{ webhookConfig.webhookSecret ?? '—' }}</dd>
            </div>
          </dl>
          <UButton size="sm" color="neutral" variant="soft" icon="i-lucide-pencil" @click="openEditConfig">
            Edit
          </UButton>
        </div>
      </template>
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
        export-filename="webhook-deliveries"
        :row-number-start="(page - 1) * pageSize"
        @refresh="load"
        @select="openDetail"
      />

      <div v-if="total > 0" class="pt-4">
        <DataPagination v-model:page="page" v-model:page-size="pageSize" :total="total" />
      </div>
    </UCard>

    <UModal
      v-model:open="showDetail"
      :title="selectedDelivery ? `${selectedDelivery.eventType} delivery` : 'Webhook delivery'"
    >
      <template #body>
        <WebhookDeliveryDetailPanel v-if="selectedDelivery" :delivery="selectedDelivery" @retried="onRetried" />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#shared/types'
import type { WebhookDelivery, WebhookEventType } from '~/composables/useWebhooks'
import type { Merchant } from '~/composables/useMerchants'

definePageMeta({ middleware: 'admin' })

const { listDeliveries } = useWebhooks()
const { search: searchMerchants, getWebhookConfig, updateWebhookConfig } = useMerchants()
const toast = useToast()

const rows = ref<WebhookDelivery[]>([])
const loading = ref(false)
const error = ref('')

const filter = reactive<{ eventType: WebhookEventType | undefined; success: boolean | undefined }>({
  eventType: undefined,
  success: undefined
})
const eventTypeOptions = [
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Withdrawal', value: 'WITHDRAWAL' },
  { label: 'Payment sent', value: 'PAYMENT_SENT' },
  { label: 'Payment received', value: 'PAYMENT_RECEIVED' }
]
const eventTypeFilterOptions = [{ label: 'All event types', value: undefined }, ...eventTypeOptions]
const statusFilterOptions = [
  { label: 'All statuses', value: undefined },
  { label: 'Success', value: true },
  { label: 'Failed', value: false }
]

// Merchant search — same search-as-you-type combobox shape as Transfer
// Management's recipient picker (app/pages/transfers/index.vue).
const merchantQuery = ref('')
const merchants = ref<Merchant[]>([])
const searchingMerchants = ref(false)
const selectedMerchantId = ref<number | undefined>()
const merchantOptions = computed(() => merchants.value.map((m) => ({ label: m.name, value: m.id })))
const selectedMerchant = computed(() => merchantOptions.value.find((m) => m.value === selectedMerchantId.value))

let merchantDebounce: ReturnType<typeof setTimeout> | undefined
watch(merchantQuery, (query) => {
  if (merchantDebounce) clearTimeout(merchantDebounce)
  if (!query || query.trim().length === 0) return
  merchantDebounce = setTimeout(async () => {
    searchingMerchants.value = true
    try {
      merchants.value = await searchMerchants(query.trim())
    } catch {
      merchants.value = []
    } finally {
      searchingMerchants.value = false
    }
  }, 300)
})

// ── Webhook configuration card (shown once a merchant is selected) ────────
const webhookConfig = ref<{ webhookUrl: string | null; webhookSecret: string | null } | null>(null)
const configLoading = ref(false)
const configError = ref('')
const editingConfig = ref(false)
const configForm = ref<Record<string, any>>({})
const savingConfig = ref(false)
const saveConfigError = ref('')
const configFields = [{ name: 'webhookUrl', label: 'Webhook URL', type: 'url' as const, required: true }]

async function loadWebhookConfig() {
  if (!selectedMerchantId.value) {
    webhookConfig.value = null
    return
  }
  configLoading.value = true
  configError.value = ''
  editingConfig.value = false
  try {
    webhookConfig.value = await getWebhookConfig(selectedMerchantId.value)
  } catch (err) {
    configError.value = apiErrorMessage(err)
  } finally {
    configLoading.value = false
  }
}

function openEditConfig() {
  configForm.value = { webhookUrl: webhookConfig.value?.webhookUrl ?? '' }
  saveConfigError.value = ''
  editingConfig.value = true
}

async function onSaveConfig(values: Record<string, any>) {
  if (!selectedMerchantId.value) return
  savingConfig.value = true
  saveConfigError.value = ''
  try {
    webhookConfig.value = await updateWebhookConfig(selectedMerchantId.value, values.webhookUrl)
    editingConfig.value = false
    toast.add({ title: 'Webhook configuration updated', color: 'success' })
  } catch (err) {
    saveConfigError.value = apiErrorMessage(err)
  } finally {
    savingConfig.value = false
  }
}

watch(selectedMerchantId, loadWebhookConfig)

// ── Delivery list ──────────────────────────────────────────────────────────
const sort = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>({
  column: 'attemptedAt',
  direction: 'desc'
})
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const columns: ColumnDef<WebhookDelivery>[] = [
  { key: 'merchantName', label: 'Merchant', value: (row) => row.merchantName ?? `#${row.merchantId}` },
  { key: 'eventType', type: 'text' },
  { key: 'transactionId', label: 'Transaction', value: (row) => `#${row.transactionId}` },
  { key: 'success', type: 'boolean', trueLabel: 'Success', falseLabel: 'Failed' },
  { key: 'httpStatus', label: 'HTTP', value: (row) => row.httpStatus ?? '—' },
  { key: 'attemptedAt', label: 'Attempted', type: 'datetime', sortable: true }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await listDeliveries({
      merchantId: selectedMerchantId.value,
      eventType: filter.eventType,
      success: filter.success,
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
watch(() => [filter.eventType, filter.success, selectedMerchantId.value], resetToFirstPage)
watch(pageSize, resetToFirstPage)
watch(page, load)

const showDetail = ref(false)
const selectedDelivery = ref<WebhookDelivery | null>(null)

function openDetail(row: WebhookDelivery) {
  selectedDelivery.value = row
  showDetail.value = true
}

function onRetried() {
  toast.add({ title: 'Webhook retried', color: 'success' })
  load()
}

onMounted(load)
</script>
