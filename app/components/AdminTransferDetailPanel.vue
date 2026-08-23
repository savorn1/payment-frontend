<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <StatusBadge :status="payment.status" />
      <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(payment.amount) }}</p>
    </div>

    <p v-if="payment.status === 'FAILED' && payment.failureReason" class="text-sm text-error mb-4">
      {{ payment.failureReason }}
    </p>

    <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <div>
        <dt class="text-gray-500 dark:text-gray-400">From</dt>
        <dd class="font-medium text-gray-900 dark:text-white">
          {{ payment.payerUsername ?? `#${payment.payerUserId}` }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">To</dt>
        <dd class="font-medium text-gray-900 dark:text-white">
          {{ payment.payeeUsername ?? `#${payment.payeeUserId}` }}
        </dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Amount</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(payment.amount) }}</dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Fee</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(payment.feeAmount) }}</dd>
      </div>
      <div class="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-800">
        <dt class="text-gray-500 dark:text-gray-400">Total</dt>
        <dd class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatCurrency(payment.totalAmount) }}</dd>
      </div>
      <div v-if="payment.description" class="col-span-2">
        <dt class="text-gray-500 dark:text-gray-400">Description</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ payment.description }}</dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Created</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(payment.createdAt) }}</dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Updated</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(payment.updatedAt) }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { AdminPayment } from '~/composables/usePayments'

defineProps<{ payment: AdminPayment }>()
</script>
