<template>
  <UModal v-model:open="open" title="New payment">
    <template #body>
      <template v-if="step === 'form'">
        <UAlert v-if="error" color="error" variant="subtle" class="mb-4" :title="error" icon="i-lucide-triangle-alert" />

        <UFormField label="Recipient" name="recipient" class="mb-4">
          <USelectMenu
            v-model="selectedRecipientId"
            v-model:search-term="recipientQuery"
            value-key="value"
            :items="recipientOptions"
            :loading="searchingRecipients"
            placeholder="Search by username"
            icon="i-lucide-search"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Amount" name="amount" class="mb-4">
          <UInput v-model="amountInput" type="number" step="0.01" icon="i-lucide-dollar-sign" placeholder="0.00" />
        </UFormField>

        <UFormField label="Description (optional)" name="description">
          <UTextarea v-model="description" :rows="3" class="w-full" placeholder="What's this for?" />
        </UFormField>

        <div v-if="parsedAmount > 0" class="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Fee</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ quoteLoading ? '···' : formatCurrency(feePreview) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Total to send</span>
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
          Review transfer
        </h3>

        <UAlert v-if="error" color="error" variant="subtle" class="mb-4" :title="error" icon="i-lucide-triangle-alert" />

        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-6">
          <div class="col-span-2">
            <dt class="text-gray-500 dark:text-gray-400">Recipient</dt>
            <dd class="font-medium text-gray-900 dark:text-white">{{ selectedRecipientLabel }}</dd>
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
            <dt class="text-gray-500 dark:text-gray-400">Total to send</dt>
            <dd class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatCurrency(totalPreview) }}</dd>
          </div>
        </dl>

        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :disabled="loading" @click="step = 'form'">Back</UButton>
          <UButton :loading="loading" @click="onConfirm">Confirm transfer</UButton>
        </div>
      </template>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { PaymentQuote, RecipientOption } from '~/composables/usePayments'

const open = defineModel<boolean>({ default: false })

defineProps<{ loading?: boolean; error?: string }>()
const emit = defineEmits<{ submit: [payload: { payeeUserId: number; amount: number; description?: string }] }>()

const { quote: fetchQuote, searchRecipients } = usePayments()

const step = ref<'form' | 'confirm'>('form')

const recipientQuery = ref('')
const recipients = ref<RecipientOption[]>([])
const searchingRecipients = ref(false)
const selectedRecipientId = ref<number | undefined>()
const recipientOptions = computed(() => recipients.value.map((r) => ({ label: r.username, value: r.id })))
const selectedRecipientLabel = computed(
  () => recipientOptions.value.find((o) => o.value === selectedRecipientId.value)?.label ?? ''
)

const amountInput = ref('')
const description = ref('')
const quote = ref<PaymentQuote | null>(null)
const quoteLoading = ref(false)

const parsedAmount = computed(() => Number(amountInput.value) || 0)
const feePreview = computed(() => quote.value?.feeAmount ?? 0)
const totalPreview = computed(() => quote.value?.totalAmount ?? parsedAmount.value)
const canContinue = computed(() => parsedAmount.value > 0 && selectedRecipientId.value !== undefined)

let recipientDebounce: ReturnType<typeof setTimeout> | undefined
watch(recipientQuery, (query) => {
  if (recipientDebounce) clearTimeout(recipientDebounce)
  // Selecting an item resets the search term to '' — don't wipe `recipients`
  // here or the just-picked option (and its label) disappears with it.
  if (!query || query.trim().length === 0) return
  recipientDebounce = setTimeout(async () => {
    searchingRecipients.value = true
    try {
      recipients.value = await searchRecipients(query.trim())
    } catch {
      recipients.value = []
    } finally {
      searchingRecipients.value = false
    }
  }, 300)
})

async function loadInitialRecipients() {
  searchingRecipients.value = true
  try {
    recipients.value = await searchRecipients('')
  } catch {
    recipients.value = []
  } finally {
    searchingRecipients.value = false
  }
}

let amountDebounce: ReturnType<typeof setTimeout> | undefined
watch(amountInput, () => {
  if (amountDebounce) clearTimeout(amountDebounce)
  const amount = parsedAmount.value
  if (amount <= 0) {
    quote.value = null
    return
  }
  amountDebounce = setTimeout(async () => {
    quoteLoading.value = true
    try {
      quote.value = await fetchQuote(amount)
    } catch {
      // Non-fatal — createPayment still validates authoritatively server-side;
      // just skip the live preview if the quote call fails.
    } finally {
      quoteLoading.value = false
    }
  }, 300)
})

watch(open, (value) => {
  if (!value) return
  step.value = 'form'
  recipientQuery.value = ''
  recipients.value = []
  selectedRecipientId.value = undefined
  amountInput.value = ''
  description.value = ''
  quote.value = null
  // Without this, the picker stays empty until the admin types something —
  // looks like there's no recipient selector at all.
  loadInitialRecipients()
})

function onConfirm() {
  if (selectedRecipientId.value === undefined) return
  emit('submit', {
    payeeUserId: selectedRecipientId.value,
    amount: parsedAmount.value,
    description: description.value.trim() || undefined
  })
}
</script>
