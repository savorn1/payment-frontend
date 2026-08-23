<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <StatusBadge :status="payment.status" />
      <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(payment.amount) }}</p>
    </div>

    <div v-if="payment.status === 'SUCCESS'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
        <UIcon name="i-lucide-check-circle" class="w-9 h-9 text-success" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Transfer successful</p>
      <p class="text-4xl font-semibold text-gray-900 dark:text-white mt-1">{{ formatCurrency(payment.totalAmount) }}</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
        {{ isSent ? `sent to user #${payment.payeeUserId}` : `received from user #${payment.payerUserId}` }}
      </p>
    </div>

    <div v-else-if="payment.status === 'FAILED'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
        <UIcon name="i-lucide-x-circle" class="w-9 h-9 text-error" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Transfer failed</p>
      <p class="text-base font-medium text-gray-900 dark:text-white mt-1">
        {{ payment.failureReason ?? 'The transfer could not be completed.' }}
      </p>
    </div>

    <p v-else class="text-sm text-gray-500 dark:text-gray-400 mb-4">Processing…</p>

    <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <div>
        <dt class="text-gray-500 dark:text-gray-400">{{ isSent ? 'To' : 'From' }}</dt>
        <dd class="font-medium text-gray-900 dark:text-white">
          #{{ isSent ? payment.payeeUserId : payment.payerUserId }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Fee</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(payment.feeAmount) }}</dd>
      </div>
      <div v-if="payment.description" class="col-span-2">
        <dt class="text-gray-500 dark:text-gray-400">Description</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ payment.description }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { Payment } from '~/composables/usePayments'

const props = defineProps<{ payment: Payment; myUserId?: number }>()
const isSent = computed(() => props.myUserId !== undefined && props.payment.payerUserId === props.myUserId)
</script>
