<template>
  <div>
    <template v-if="deposit.status === 'PENDING'">
      <div class="flex flex-col items-center gap-4 py-2">
        <div class="bg-white p-4 rounded-lg ring-1 ring-gray-200">
          <QrCode :value="deposit.qrCodeData ?? ''" :size="180" />
        </div>
        <UButton
          v-if="deposit.paymentUrl"
          :to="deposit.paymentUrl"
          target="_blank"
          icon="i-lucide-external-link"
          variant="soft"
          color="neutral"
        >
          Open payment page
        </UButton>
        <div class="flex items-center gap-2">
          <StatusBadge :status="deposit.status" />
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="checking"
            @click="onCheckStatus"
          >
            Refresh status
          </UButton>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-800">
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Sandbox — this app has no real payment gateway. Use these to simulate the outcome.
        </p>
        <div class="flex gap-2">
          <UButton
            size="xs"
            color="success"
            variant="soft"
            :loading="simulating === 'success'"
            :disabled="!!simulating"
            @click="onSimulate('success')"
          >
            Simulate success
          </UButton>
          <UButton
            size="xs"
            color="error"
            variant="soft"
            :loading="simulating === 'failed'"
            :disabled="!!simulating"
            @click="onSimulate('failed')"
          >
            Simulate failure
          </UButton>
        </div>
        <UAlert v-if="error" color="error" variant="subtle" class="mt-3" :title="error" />
      </div>
    </template>

    <div v-else-if="deposit.status === 'SUCCESS'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
        <UIcon name="i-lucide-check-circle" class="w-9 h-9 text-success" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Deposit successful</p>
      <p class="text-4xl font-semibold text-gray-900 dark:text-white mt-1">{{ formatCurrency(deposit.amount) }}</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">added to your wallet</p>
    </div>

    <div v-else class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
        <UIcon name="i-lucide-x-circle" class="w-9 h-9 text-error" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Deposit failed</p>
      <p class="text-base font-medium text-gray-900 dark:text-white mt-1">
        {{ deposit.failureReason ?? 'The payment could not be completed.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Deposit } from '~/composables/useDeposits'

const props = defineProps<{ deposit: Deposit }>()
const emit = defineEmits<{ update: [deposit: Deposit] }>()

const { checkStatus, simulateSuccess, simulateFailed } = useDeposits()

const checking = ref(false)
const simulating = ref<'success' | 'failed' | ''>('')
const error = ref('')

async function onCheckStatus() {
  checking.value = true
  error.value = ''
  try {
    emit('update', await checkStatus(props.deposit.id))
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    checking.value = false
  }
}

async function onSimulate(outcome: 'success' | 'failed') {
  simulating.value = outcome
  error.value = ''
  try {
    const updated = outcome === 'success' ? await simulateSuccess(props.deposit.id) : await simulateFailed(props.deposit.id)
    emit('update', updated)
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    simulating.value = ''
  }
}
</script>
