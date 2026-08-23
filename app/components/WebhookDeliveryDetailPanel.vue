<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <StatusBadge :status="delivery.success ? 'SUCCESS' : 'FAILED'" />
      <UButton size="sm" icon="i-lucide-refresh-cw" :loading="retrying" @click="onRetry">Retry</UButton>
    </div>

    <UAlert v-if="retryError" color="error" variant="subtle" class="mb-4" :title="retryError" />
    <UAlert
      v-if="retried"
      color="success"
      variant="subtle"
      class="mb-4"
      title="Retried"
      description="A new delivery attempt was recorded — refresh the list to see it."
    />

    <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Merchant</dt>
        <dd class="font-medium text-gray-900 dark:text-white">
          {{ delivery.merchantName ?? `#${delivery.merchantId}` }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Event type</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatEnum(delivery.eventType) }}</dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Transaction ID</dt>
        <dd class="font-medium text-gray-900 dark:text-white">#{{ delivery.transactionId }}</dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">HTTP status</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ delivery.httpStatus ?? '—' }}</dd>
      </div>
      <div class="col-span-2">
        <dt class="text-gray-500 dark:text-gray-400">URL</dt>
        <dd class="font-medium text-gray-900 dark:text-white break-all">{{ delivery.url }}</dd>
      </div>
      <div v-if="delivery.errorMessage" class="col-span-2">
        <dt class="text-gray-500 dark:text-gray-400">Error</dt>
        <dd class="font-medium text-error">{{ delivery.errorMessage }}</dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Attempted</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(delivery.attemptedAt) }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { WebhookDelivery } from '~/composables/useWebhooks'

const props = defineProps<{ delivery: WebhookDelivery }>()
const emit = defineEmits<{ retried: [WebhookDelivery] }>()

const { retryDelivery } = useWebhooks()

const retrying = ref(false)
const retryError = ref('')
const retried = ref(false)

async function onRetry() {
  retrying.value = true
  retryError.value = ''
  retried.value = false
  try {
    const newDelivery = await retryDelivery(props.delivery.id)
    retried.value = true
    emit('retried', newDelivery)
  } catch (err) {
    retryError.value = apiErrorMessage(err)
  } finally {
    retrying.value = false
  }
}
</script>
