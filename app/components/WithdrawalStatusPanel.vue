<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <StatusBadge :status="withdrawal.status" />
      <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(withdrawal.amount) }}</p>
    </div>

    <p v-if="withdrawal.status === 'PENDING'" class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Awaiting admin approval.
    </p>
    <p v-else-if="withdrawal.status === 'APPROVED'" class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Approved — awaiting processing.
    </p>

    <div v-if="withdrawal.status === 'SUCCESS'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
        <UIcon name="i-lucide-check-circle" class="w-9 h-9 text-success" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Withdrawal successful</p>
      <p class="text-4xl font-semibold text-gray-900 dark:text-white mt-1">{{ formatCurrency(withdrawal.totalAmount) }}</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">sent to {{ withdrawal.destination }}</p>
    </div>

    <div v-else-if="withdrawal.status === 'FAILED'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
        <UIcon name="i-lucide-x-circle" class="w-9 h-9 text-error" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Withdrawal failed</p>
      <p class="text-base font-medium text-gray-900 dark:text-white mt-1">
        {{ withdrawal.failureReason ?? 'The payout could not be completed.' }}
      </p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">
        Held funds have been released back to your available balance.
      </p>
    </div>

    <div v-else-if="withdrawal.status === 'REJECTED'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
        <UIcon name="i-lucide-ban" class="w-9 h-9 text-error" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Withdrawal rejected</p>
      <p class="text-base font-medium text-gray-900 dark:text-white mt-1">
        {{ withdrawal.rejectionReason ?? 'This withdrawal was rejected.' }}
      </p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-2">
        Held funds have been released back to your available balance.
      </p>
    </div>

    <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <div class="col-span-2">
        <dt class="text-gray-500 dark:text-gray-400">Destination</dt>
        <dd class="font-medium text-gray-900 dark:text-white break-all">{{ withdrawal.destination }}</dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Fee</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(withdrawal.feeAmount) }}</dd>
      </div>
      <div>
        <dt class="text-gray-500 dark:text-gray-400">Total held</dt>
        <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(withdrawal.totalAmount) }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import type { Withdrawal } from '~/composables/useWithdrawals'

defineProps<{ withdrawal: Withdrawal }>()
</script>
