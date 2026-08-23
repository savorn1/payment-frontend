<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <StatusBadge :status="merchant.status === 'ACTIVE' ? 'UP' : 'DISABLED'" />
        <span class="font-medium text-gray-900 dark:text-white">{{ merchant.name }}</span>
      </div>
      <UButton
        v-if="merchant.status === 'ACTIVE'"
        size="sm"
        color="error"
        variant="soft"
        icon="i-lucide-power-off"
        @click="showDeactivateConfirm = true"
      >
        Deactivate
      </UButton>
      <UButton v-else size="sm" color="success" variant="soft" icon="i-lucide-power" :loading="toggling" @click="onActivate">
        Activate
      </UButton>
    </div>

    <UTabs v-model="activeTab" :items="tabItems" class="w-full">
      <template #details>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
          <div>
            <dt class="text-gray-500 dark:text-gray-400">User ID</dt>
            <dd class="font-medium text-gray-900 dark:text-white">#{{ merchant.userId }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Status</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ merchant.status }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Created</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(merchant.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Updated</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(merchant.updatedAt) }}</dd>
          </div>
        </dl>
        <DynamicForm
          v-model="nameForm"
          :fields="nameFields"
          :loading="savingName"
          :error="saveNameError"
          submit-label="Save name"
          @submit="onSaveName"
        />
      </template>

      <template #credentials>
        <UAlert v-if="createdKey" color="success" variant="subtle" class="mb-4" title="API key created" icon="i-lucide-key-round">
          <template #description>
            <p class="mb-1">Copy this now — it will not be shown again:</p>
            <code class="block break-all rounded bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs">{{ createdKey }}</code>
          </template>
        </UAlert>
        <UAlert v-if="apiKeyError" color="error" variant="subtle" class="mb-3" :title="apiKeyError" />

        <div class="flex justify-end mb-3">
          <UButton size="xs" icon="i-lucide-plus" :loading="creatingKey" @click="onCreateApiKey">Create API key</UButton>
        </div>

        <DataTable
          :rows="apiKeys"
          :columns="apiKeyColumns"
          :loading="apiKeysLoading"
          refreshable
          exportable
          :export-filename="`${merchant.name}-api-keys`"
          @refresh="loadApiKeys"
        >
          <template #actions-data="{ row }">
            <UButton
              v-if="row.status === 'ACTIVE'"
              size="xs"
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              @click="confirmRevoke = row"
            >
              Revoke
            </UButton>
          </template>
        </DataTable>

        <ConfirmModal
          :model-value="confirmRevoke !== null"
          title="Revoke API key"
          :description="`Revoke key '${confirmRevoke?.keyId ?? ''}'? Any integration using it will stop working immediately.`"
          confirm-label="Revoke"
          color="error"
          :loading="revokingKey"
          @update:model-value="(v: boolean) => { if (!v) confirmRevoke = null }"
          @confirm="onRevokeApiKey"
        />
      </template>

      <template #webhook>
        <div v-if="webhookLoading" class="flex justify-center py-6">
          <UIcon name="i-lucide-loader-circle" class="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        <UAlert v-else-if="webhookError" color="error" variant="subtle" :title="webhookError" />
        <template v-else-if="webhookConfig">
          <DynamicForm
            v-if="editingWebhook"
            v-model="webhookForm"
            :fields="webhookFields"
            :loading="savingWebhook"
            :error="saveWebhookError"
            submit-label="Save"
            cancelable
            @submit="onSaveWebhook"
            @cancel="editingWebhook = false"
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
            <UButton size="sm" color="neutral" variant="soft" icon="i-lucide-pencil" @click="openEditWebhook">
              Edit
            </UButton>
          </div>
        </template>
      </template>

      <template #history>
        <div class="space-y-6">
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Deposits</h3>
            <DataTable
              :rows="deposits"
              :columns="depositColumns"
              :loading="historyLoading"
              exportable
              :export-filename="`${merchant.name}-deposits`"
            />
          </div>
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Withdrawals</h3>
            <DataTable
              :rows="withdrawals"
              :columns="withdrawalColumns"
              :loading="historyLoading"
              exportable
              :export-filename="`${merchant.name}-withdrawals`"
            />
          </div>
          <div>
            <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Payments sent</h3>
            <DataTable
              :rows="payments"
              :columns="paymentColumns"
              :loading="historyLoading"
              exportable
              :export-filename="`${merchant.name}-payments`"
            />
          </div>
        </div>
      </template>

      <template #limits>
        <div v-if="limitsLoading" class="flex justify-center py-6">
          <UIcon name="i-lucide-loader-circle" class="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        <UAlert v-else-if="limitsError" color="error" variant="subtle" :title="limitsError" />
        <template v-else-if="limits">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Platform-wide withdrawal limits — these apply to this merchant the same as any user. Edit them from
            <NuxtLink to="/fees-limits" class="text-primary-500 font-medium">Fees &amp; Limits</NuxtLink>.
          </p>
          <dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Flat fee</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(limits.flatFee) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Fee percentage</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ limits.feePercentage }}</dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Min amount</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(limits.minAmount) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Max amount</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(limits.maxAmount) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Daily limit</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(limits.dailyLimit) }}</dd>
            </div>
            <div>
              <dt class="text-gray-500 dark:text-gray-400">Monthly limit</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(limits.monthlyLimit) }}</dd>
            </div>
          </dl>
        </template>
      </template>
    </UTabs>

    <ConfirmModal
      v-model="showDeactivateConfirm"
      title="Deactivate merchant"
      description="This merchant's API keys will stop authenticating immediately. Existing pending transactions are unaffected."
      confirm-label="Deactivate"
      color="error"
      :loading="toggling"
      @confirm="onDeactivate"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef, FieldDef } from '#shared/types'
import type { ApiKey, Merchant } from '~/composables/useMerchants'
import type { AdminDeposit } from '~/composables/useDeposits'
import type { AdminWithdrawal } from '~/composables/useWithdrawals'
import type { AdminPayment } from '~/composables/usePayments'
import type { WebhookConfig } from '~/composables/useMerchants'
import type { WithdrawalLimitConfig } from '~/composables/useFeesLimits'

const props = defineProps<{ merchant: Merchant }>()
const emit = defineEmits<{ updated: [Merchant] }>()

const {
  update,
  updateStatus,
  getWebhookConfig,
  updateWebhookConfig,
  listApiKeys,
  createApiKey,
  revokeApiKey
} = useMerchants()
const { listAll: listAllDeposits } = useDeposits()
const { listAll: listAllWithdrawals } = useWithdrawals()
const { listAll: listAllPayments } = usePayments()
const { getWithdrawalConfig } = useFeesLimits()

const merchant = ref<Merchant>(props.merchant)
watch(
  () => props.merchant,
  (m) => (merchant.value = m)
)

const activeTab = ref('details')
const tabItems = [
  { label: 'Details', icon: 'i-lucide-info', slot: 'details' as const, value: 'details' },
  { label: 'API credentials', icon: 'i-lucide-key-round', slot: 'credentials' as const, value: 'credentials' },
  { label: 'Webhook', icon: 'i-lucide-webhook', slot: 'webhook' as const, value: 'webhook' },
  { label: 'Transaction history', icon: 'i-lucide-history', slot: 'history' as const, value: 'history' },
  { label: 'Limits', icon: 'i-lucide-percent', slot: 'limits' as const, value: 'limits' }
]

// ── Details / name edit ──────────────────────────────────────────────────
const nameForm = ref<Record<string, any>>({ name: merchant.value.name })
const nameFields: FieldDef[] = [{ name: 'name', label: 'Merchant name', required: true }]
const savingName = ref(false)
const saveNameError = ref('')

async function onSaveName(values: Record<string, any>) {
  savingName.value = true
  saveNameError.value = ''
  try {
    merchant.value = await update(merchant.value.id, values.name)
    emit('updated', merchant.value)
  } catch (err) {
    saveNameError.value = apiErrorMessage(err)
  } finally {
    savingName.value = false
  }
}

// ── Activate / deactivate ────────────────────────────────────────────────
const toggling = ref(false)
const showDeactivateConfirm = ref(false)

async function onActivate() {
  toggling.value = true
  try {
    merchant.value = await updateStatus(merchant.value.id, 'ACTIVE')
    emit('updated', merchant.value)
  } finally {
    toggling.value = false
  }
}

async function onDeactivate() {
  toggling.value = true
  try {
    merchant.value = await updateStatus(merchant.value.id, 'SUSPENDED')
    emit('updated', merchant.value)
    showDeactivateConfirm.value = false
  } finally {
    toggling.value = false
  }
}

// ── API credentials ──────────────────────────────────────────────────────
const apiKeys = ref<ApiKey[]>([])
const apiKeysLoading = ref(false)
const apiKeyError = ref('')
const creatingKey = ref(false)
const createdKey = ref('')
const confirmRevoke = ref<ApiKey | null>(null)
const revokingKey = ref(false)

const apiKeyColumns: ColumnDef<ApiKey>[] = [
  { key: 'keyId', label: 'Key ID' },
  { key: 'status', type: 'status' },
  { key: 'lastUsedAt', label: 'Last used', type: 'datetime' },
  { key: 'createdAt', label: 'Created', type: 'datetime' },
  { key: 'actions', label: '' }
]

async function loadApiKeys() {
  apiKeysLoading.value = true
  apiKeyError.value = ''
  try {
    apiKeys.value = await listApiKeys(merchant.value.id)
  } catch (err) {
    apiKeyError.value = apiErrorMessage(err)
  } finally {
    apiKeysLoading.value = false
  }
}

async function onCreateApiKey() {
  creatingKey.value = true
  apiKeyError.value = ''
  createdKey.value = ''
  try {
    const created = await createApiKey(merchant.value.id)
    createdKey.value = created.rawKey
    await loadApiKeys()
  } catch (err) {
    apiKeyError.value = apiErrorMessage(err)
  } finally {
    creatingKey.value = false
  }
}

async function onRevokeApiKey() {
  if (!confirmRevoke.value) return
  revokingKey.value = true
  try {
    await revokeApiKey(merchant.value.id, confirmRevoke.value.id)
    confirmRevoke.value = null
    await loadApiKeys()
  } catch (err) {
    apiKeyError.value = apiErrorMessage(err)
  } finally {
    revokingKey.value = false
  }
}

// ── Webhook configuration ────────────────────────────────────────────────
const webhookConfig = ref<WebhookConfig | null>(null)
const webhookLoading = ref(false)
const webhookError = ref('')
const editingWebhook = ref(false)
const webhookForm = ref<Record<string, any>>({})
const savingWebhook = ref(false)
const saveWebhookError = ref('')
const webhookFields: FieldDef[] = [{ name: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true }]

async function loadWebhookConfig() {
  webhookLoading.value = true
  webhookError.value = ''
  try {
    webhookConfig.value = await getWebhookConfig(merchant.value.id)
  } catch (err) {
    webhookError.value = apiErrorMessage(err)
  } finally {
    webhookLoading.value = false
  }
}

function openEditWebhook() {
  webhookForm.value = { webhookUrl: webhookConfig.value?.webhookUrl ?? '' }
  saveWebhookError.value = ''
  editingWebhook.value = true
}

async function onSaveWebhook(values: Record<string, any>) {
  savingWebhook.value = true
  saveWebhookError.value = ''
  try {
    webhookConfig.value = await updateWebhookConfig(merchant.value.id, values.webhookUrl)
    editingWebhook.value = false
  } catch (err) {
    saveWebhookError.value = apiErrorMessage(err)
  } finally {
    savingWebhook.value = false
  }
}

// ── Transaction history ──────────────────────────────────────────────────
const deposits = ref<AdminDeposit[]>([])
const withdrawals = ref<AdminWithdrawal[]>([])
const payments = ref<AdminPayment[]>([])
const historyLoading = ref(false)

const depositColumns: ColumnDef<AdminDeposit>[] = [
  { key: 'amount', type: 'currency' },
  { key: 'provider', type: 'text' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime' }
]
const withdrawalColumns: ColumnDef<AdminWithdrawal>[] = [
  { key: 'amount', type: 'currency' },
  { key: 'destination', type: 'text' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime' }
]
const paymentColumns: ColumnDef<AdminPayment>[] = [
  { key: 'payeeUsername', label: 'To', value: (row) => row.payeeUsername ?? `#${row.payeeUserId}` },
  { key: 'amount', type: 'currency' },
  { key: 'status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'datetime' }
]

async function loadHistory() {
  historyLoading.value = true
  try {
    const [depositRes, withdrawalRes, paymentRes] = await Promise.all([
      listAllDeposits({ userId: merchant.value.userId, size: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      listAllWithdrawals({ userId: merchant.value.userId, size: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      listAllPayments({ userId: merchant.value.userId, size: 5, sortBy: 'createdAt', sortOrder: 'desc' })
    ])
    deposits.value = depositRes.data
    withdrawals.value = withdrawalRes.data
    // The admin payments filter matches either side of a transfer (payer OR
    // payee) — narrow to sent-only here since this is specifically a "sent"
    // preview; a small enough page size that this rarely drops a real row.
    payments.value = paymentRes.data.filter((p) => p.payerUserId === merchant.value.userId)
  } finally {
    historyLoading.value = false
  }
}

// ── Limits (read-only platform withdrawal limits) ────────────────────────
const limits = ref<WithdrawalLimitConfig | null>(null)
const limitsLoading = ref(false)
const limitsError = ref('')

async function loadLimits() {
  limitsLoading.value = true
  limitsError.value = ''
  try {
    limits.value = await getWithdrawalConfig()
  } catch (err) {
    limitsError.value = apiErrorMessage(err)
  } finally {
    limitsLoading.value = false
  }
}

onMounted(() => {
  loadApiKeys()
  loadWebhookConfig()
  loadHistory()
  loadLimits()
})
</script>
