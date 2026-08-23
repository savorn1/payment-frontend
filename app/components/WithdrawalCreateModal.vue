<template>
  <UModal v-model:open="open" title="New withdrawal">
    <template #body>
      <template v-if="step === 'form'">
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Withdrawal method
        </h3>
        <URadioGroup v-model="selectedProvider" :items="providerOptions" class="mb-6" />

        <UAlert v-if="error" color="error" variant="subtle" class="mb-4" :title="error" icon="i-lucide-triangle-alert" />

        <UFormField label="Withdrawal account" name="destination" class="mb-4">
          <UInput v-model="destination" icon="i-lucide-landmark" placeholder="e.g. bank account or wallet address" />
        </UFormField>

        <UFormField label="Amount" name="amount">
          <UInput v-model="amountInput" type="number" step="0.01" icon="i-lucide-dollar-sign" placeholder="0.00" />
        </UFormField>
        <p v-if="quote" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Min {{ formatCurrency(quote.minAmount) }} · Max {{ formatCurrency(quote.maxAmount) }}
        </p>

        <div v-if="parsedAmount > 0" class="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Fee</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ quoteLoading ? '···' : formatCurrency(feePreview) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Total to hold</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ quoteLoading ? '···' : formatCurrency(totalPreview) }}
            </span>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UButton color="neutral" variant="ghost" @click="open = false">Cancel</UButton>
          <UButton :disabled="!canContinue" @click="step = 'confirm'">Continue</UButton>
        </div>
      </template>

      <template v-else>
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Review withdrawal
        </h3>

        <UAlert v-if="error" color="error" variant="subtle" class="mb-4" :title="error" icon="i-lucide-triangle-alert" />

        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-6">
          <div class="col-span-2">
            <dt class="text-gray-500 dark:text-gray-400">Destination</dt>
            <dd class="font-medium text-gray-900 dark:text-white break-all">{{ destination }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Amount</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(parsedAmount) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Fee</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(feePreview) }}</dd>
          </div>
          <div class="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <dt class="text-gray-500 dark:text-gray-400">Total to be held</dt>
            <dd class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatCurrency(totalPreview) }}</dd>
          </div>
        </dl>

        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="loading" @click="step = 'form'">Back</UButton>
          <UButton :loading="loading" @click="onConfirm">Confirm withdrawal</UButton>
        </div>
      </template>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { WithdrawalQuote } from '~/composables/useWithdrawals'

const open = defineModel<boolean>({ default: false })

defineProps<{ loading?: boolean; error?: string }>()
const emit = defineEmits<{ submit: [payload: { amount: number; destination: string }] }>()

const { quote: fetchQuote } = useWithdrawals()

// Only one provider exists today (payment-wallet has no real payout
// integration) — shown as a real choice anyway since selecting a method is
// part of the flow, and it's ready for a second option later.
const providerOptions = [
  { label: 'Sample Payout', value: 'SAMPLE', description: 'Sandbox payout provider — no real transfer.' }
]
const selectedProvider = ref('SAMPLE')

const step = ref<'form' | 'confirm'>('form')
const destination = ref('')
const amountInput = ref('')
const quote = ref<WithdrawalQuote | null>(null)
const quoteLoading = ref(false)

const parsedAmount = computed(() => Number(amountInput.value) || 0)
const feePreview = computed(() => quote.value?.feeAmount ?? 0)
const totalPreview = computed(() => quote.value?.totalAmount ?? parsedAmount.value)
const canContinue = computed(() => parsedAmount.value > 0 && destination.value.trim().length > 0)

let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(amountInput, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const amount = parsedAmount.value
  if (amount <= 0) {
    quote.value = null
    return
  }
  debounceTimer = setTimeout(async () => {
    quoteLoading.value = true
    try {
      quote.value = await fetchQuote(amount)
    } catch {
      // Non-fatal — createWithdrawal still validates authoritatively server-side;
      // just skip the live preview if the quote call fails.
    } finally {
      quoteLoading.value = false
    }
  }, 300)
})

// Reset on open, and fetch once with a nominal amount so min/max show even
// before the user types a real one.
watch(open, async (value) => {
  if (!value) return
  step.value = 'form'
  destination.value = ''
  amountInput.value = ''
  quote.value = null
  try {
    quote.value = await fetchQuote(0.01)
  } catch {
    // ignore — limits just won't show
  }
})

function onConfirm() {
  emit('submit', { amount: parsedAmount.value, destination: destination.value.trim() })
}
</script>
