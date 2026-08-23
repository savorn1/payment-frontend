<template>
  <UModal v-model:open="open" title="New deposit">
    <template #body>
      <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Payment method
      </h3>
      <URadioGroup v-model="selectedProvider" :items="providerOptions" class="mb-6" />

      <UAlert v-if="error" color="error" variant="subtle" class="mb-4" :title="error" icon="i-lucide-triangle-alert" />

      <UFormField label="Amount" name="amount">
        <UInput v-model="amountInput" type="number" step="0.01" min="0.01" icon="i-lucide-dollar-sign" placeholder="0.00" />
      </UFormField>

      <div class="flex justify-end gap-2 mt-4">
        <UButton color="neutral" variant="ghost" :disabled="loading" @click="open = false">Cancel</UButton>
        <UButton :loading="loading" @click="onSubmit">Continue</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false })

defineProps<{ loading?: boolean; error?: string }>()
const emit = defineEmits<{ submit: [amount: number] }>()

// Only one provider exists today (payment-wallet has no real gateway
// integration) — shown as a real choice anyway since selecting a method is
// part of the flow, and it's ready for a second option later.
const providerOptions = [
  { label: 'Sample Gateway', value: 'SAMPLE', description: 'Sandbox payment provider — no real charge.' }
]
const selectedProvider = ref('SAMPLE')
const amountInput = ref('')

watch(open, (value) => {
  if (value) amountInput.value = ''
})

function onSubmit() {
  emit('submit', Number(amountInput.value))
}
</script>
