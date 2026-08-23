<template>
  <UModal v-model:open="open" title="Transaction detail">
    <template #body>
      <div v-if="transaction" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UBadge :color="transaction.type === 'CREDIT' ? 'success' : 'neutral'" variant="subtle">
              {{ transaction.type }}
            </UBadge>
            <StatusBadge :status="transaction.status" />
          </div>
          <p class="text-2xl font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(transaction.amount) }}
          </p>
        </div>

        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Transaction ID</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ transaction.id }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Date</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(transaction.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Available balance after</dt>
            <dd class="font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(transaction.availableBalanceAfter) }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Pending balance after</dt>
            <dd class="font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(transaction.pendingBalanceAfter) }}
            </dd>
          </div>
          <div class="col-span-2">
            <dt class="text-gray-500 dark:text-gray-400">Reference</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ transaction.referenceId ?? '—' }}</dd>
          </div>
          <div class="col-span-2">
            <dt class="text-gray-500 dark:text-gray-400">Description</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ transaction.description ?? '—' }}</dd>
          </div>
        </dl>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { WalletTransaction } from '~/composables/useWallet'

defineProps<{ transaction: WalletTransaction | null }>()
const open = defineModel<boolean>({ default: false })
</script>
