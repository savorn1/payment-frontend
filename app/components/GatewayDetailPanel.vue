<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <StatusBadge :status="gateway.enabled ? 'UP' : 'DISABLED'" />
        <span class="font-medium text-gray-900 dark:text-white">{{ gateway.providerName }}</span>
      </div>
      <UButton
        v-if="gateway.enabled"
        size="sm"
        color="error"
        variant="soft"
        icon="i-lucide-power-off"
        @click="showDisableConfirm = true"
      >
        Disable
      </UButton>
      <UButton v-else size="sm" color="success" variant="soft" icon="i-lucide-power" :loading="toggling" @click="onEnable">
        Enable
      </UButton>
    </div>

    <UTabs v-model="activeTab" :items="tabItems" class="w-full">
      <template #configuration>
        <DynamicForm
          v-model="configForm"
          :fields="configFields"
          :loading="savingConfig"
          :error="configError"
          submit-label="Save configuration"
          @submit="onSaveConfig"
        />
      </template>

      <template #credentials>
        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Current secret</p>
            <p class="font-mono text-sm text-gray-900 dark:text-white">{{ gateway.maskedSecret }}</p>
          </div>
          <DynamicForm
            v-model="credentialsForm"
            :fields="credentialsFields"
            :loading="savingCredentials"
            :error="credentialsError"
            submit-label="Rotate secret"
            @submit="onRotateSecret"
          />
        </div>
      </template>

      <template #status>
        <div v-if="healthLoading" class="flex justify-center py-10">
          <UIcon name="i-lucide-loader-circle" class="w-6 h-6 text-gray-400 animate-spin" />
        </div>
        <UAlert v-else-if="healthError" color="error" variant="subtle" :title="healthError" />
        <div v-else-if="health" class="space-y-4">
          <div class="flex items-center gap-2">
            <StatusBadge :status="health.status" />
            <span v-if="health.successRate !== null" class="text-sm text-gray-500 dark:text-gray-400">
              {{ Math.round(health.successRate * 100) }}% success (last 24h)
            </span>
          </div>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Calls (last 24h)</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ health.callsLast24h }}</dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Success / Failure</dt>
              <dd class="font-medium text-gray-900 dark:text-white">
                {{ health.successCountLast24h }} / {{ health.failureCountLast24h }}
              </dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Last call</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(health.lastCallAt) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Last call result</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ health.lastCallResult ?? '—' }}</dd>
            </div>
          </dl>
        </div>
      </template>

      <template #logs>
        <UAlert v-if="logsError" color="error" variant="subtle" class="mb-3" :title="logsError" />
        <DataTable
          v-model:sort="logsSort"
          :rows="logs"
          :columns="logColumns"
          :loading="logsLoading"
          refreshable
          @refresh="loadLogs"
        />
        <div v-if="logsTotal > 0" class="pt-4">
          <DataPagination v-model:page="logsPage" v-model:page-size="logsPageSize" :total="logsTotal" />
        </div>
      </template>
    </UTabs>

    <ConfirmModal
      v-model="showDisableConfirm"
      title="Disable payment gateway"
      description="New deposits will fail immediately with 'Payment gateway is disabled' until it's re-enabled. Existing pending deposits are unaffected."
      confirm-label="Disable"
      color="error"
      :loading="toggling"
      @confirm="onDisable"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef, FieldDef } from '#shared/types'
import type { Gateway, GatewayCallLog, GatewayHealth } from '~/composables/useGateways'

const props = defineProps<{ gateway: Gateway }>()
const emit = defineEmits<{ updated: [Gateway] }>()

const { updateConfiguration, updateCredentials, enable, disable, getHealth, listLogs } = useGateways()

const gateway = ref<Gateway>(props.gateway)
watch(
  () => props.gateway,
  (g) => (gateway.value = g)
)

const activeTab = ref('configuration')
const tabItems = [
  { label: 'Configuration', icon: 'i-lucide-settings', slot: 'configuration' as const, value: 'configuration' },
  { label: 'Credentials', icon: 'i-lucide-key-round', slot: 'credentials' as const, value: 'credentials' },
  { label: 'Status', icon: 'i-lucide-activity', slot: 'status' as const, value: 'status' },
  { label: 'Transaction Logs', icon: 'i-lucide-list', slot: 'logs' as const, value: 'logs' }
]

// ── Configuration ───────────────────────────────────────────────────────
const configForm = ref<Record<string, any>>({
  baseUrl: gateway.value.baseUrl,
  timeoutMs: gateway.value.timeoutMs,
  maxRetries: gateway.value.maxRetries,
  retryBackoffMs: gateway.value.retryBackoffMs,
  latencyMs: gateway.value.latencyMs
})
const configFields: FieldDef[] = [
  { name: 'baseUrl', label: 'Base URL', type: 'url', required: true, wrapper: 'full' },
  { name: 'timeoutMs', label: 'Timeout (ms)', type: 'number', required: true, min: 1 },
  { name: 'maxRetries', label: 'Max retries', type: 'number', required: true, min: 1 },
  { name: 'retryBackoffMs', label: 'Retry backoff (ms)', type: 'number', required: true, min: 0 },
  { name: 'latencyMs', label: 'Simulated latency (ms)', type: 'number', required: true, min: 0 }
]
const savingConfig = ref(false)
const configError = ref('')

async function onSaveConfig(values: Record<string, any>) {
  savingConfig.value = true
  configError.value = ''
  try {
    gateway.value = await updateConfiguration(gateway.value.id, {
      baseUrl: values.baseUrl,
      timeoutMs: Number(values.timeoutMs),
      maxRetries: Number(values.maxRetries),
      retryBackoffMs: Number(values.retryBackoffMs),
      latencyMs: Number(values.latencyMs)
    })
    emit('updated', gateway.value)
  } catch (err) {
    configError.value = apiErrorMessage(err)
  } finally {
    savingConfig.value = false
  }
}

// ── Credentials ──────────────────────────────────────────────────────────
const credentialsForm = ref<Record<string, any>>({ secret: '' })
const credentialsFields: FieldDef[] = [
  { name: 'secret', label: 'New secret', type: 'password', required: true, wrapper: 'full' }
]
const savingCredentials = ref(false)
const credentialsError = ref('')

async function onRotateSecret(values: Record<string, any>) {
  savingCredentials.value = true
  credentialsError.value = ''
  try {
    gateway.value = await updateCredentials(gateway.value.id, values.secret)
    credentialsForm.value = { secret: '' }
    emit('updated', gateway.value)
  } catch (err) {
    credentialsError.value = apiErrorMessage(err)
  } finally {
    savingCredentials.value = false
  }
}

// ── Enable / disable ─────────────────────────────────────────────────────
const toggling = ref(false)
const showDisableConfirm = ref(false)

async function onEnable() {
  toggling.value = true
  try {
    gateway.value = await enable(gateway.value.id)
    emit('updated', gateway.value)
  } finally {
    toggling.value = false
  }
}

async function onDisable() {
  toggling.value = true
  try {
    gateway.value = await disable(gateway.value.id)
    emit('updated', gateway.value)
    showDisableConfirm.value = false
  } finally {
    toggling.value = false
  }
}

// ── Status / health ──────────────────────────────────────────────────────
const health = ref<GatewayHealth | null>(null)
const healthLoading = ref(false)
const healthError = ref('')

async function loadHealth() {
  healthLoading.value = true
  healthError.value = ''
  try {
    health.value = await getHealth(gateway.value.id)
  } catch (err) {
    healthError.value = apiErrorMessage(err)
  } finally {
    healthLoading.value = false
  }
}

// ── Transaction logs ─────────────────────────────────────────────────────
const logs = ref<GatewayCallLog[]>([])
const logsLoading = ref(false)
const logsError = ref('')
const logsPage = ref(1)
const logsPageSize = ref(10)
const logsTotal = ref(0)
const logsSort = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>({
  column: 'createdAt',
  direction: 'desc'
})

const logColumns: ColumnDef<GatewayCallLog>[] = [
  { key: 'target', type: 'text' },
  { key: 'success', type: 'boolean', trueLabel: 'Success', falseLabel: 'Failed' },
  { key: 'result', type: 'text' },
  { key: 'attempts', type: 'number' },
  { key: 'durationMs', label: 'Duration (ms)', type: 'number' },
  { key: 'errorMessage', label: 'Error', value: (row) => row.errorMessage ?? '—' },
  { key: 'createdAt', label: 'Time', type: 'datetime' }
]

async function loadLogs() {
  logsLoading.value = true
  logsError.value = ''
  try {
    const res = await listLogs(gateway.value.id, {
      sortBy: logsSort.value?.column,
      sortOrder: logsSort.value?.direction,
      page: logsPage.value,
      size: logsPageSize.value
    })
    logs.value = res.data
    logsTotal.value = res.metadata.totalCount
  } catch (err) {
    logsError.value = apiErrorMessage(err)
  } finally {
    logsLoading.value = false
  }
}

watch(logsSort, () => {
  logsPage.value = 1
  loadLogs()
})
watch(logsPageSize, () => {
  logsPage.value = 1
  loadLogs()
})
watch(logsPage, loadLogs)

onMounted(() => {
  loadHealth()
  loadLogs()
})
</script>
