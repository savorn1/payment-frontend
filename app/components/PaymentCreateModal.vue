<template>
  <UModal v-model:open="open" title="New payment">
    <template #body>
      <DynamicForm
        v-model="form"
        :fields="fields"
        :loading="loading"
        :error="error"
        submit-label="Send payment"
        cancelable
        @submit="onSubmit"
        @cancel="open = false"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FieldDef } from '#shared/types'
import type { CreatePaymentRequest } from '~/composables/usePayments'

const open = defineModel<boolean>({ default: false })

defineProps<{ loading?: boolean; error?: string }>()
const emit = defineEmits<{ submit: [payload: CreatePaymentRequest] }>()

const form = ref<Record<string, any>>({})

const fields: FieldDef[] = [
  {
    name: 'payeeUserId',
    type: 'number',
    label: 'Payee user ID',
    hint: "The recipient's numeric user ID.",
    required: true,
    min: 1
  },
  { name: 'amount', type: 'currency', required: true },
  { name: 'description', type: 'textarea', rows: 3 }
]

// Reset the form each time the modal is reopened, so a previous attempt's
// values never leak into the next one.
watch(open, (value) => {
  if (value) form.value = {}
})

function onSubmit(values: Record<string, any>) {
  emit('submit', {
    payeeUserId: Number(values.payeeUserId),
    amount: Number(values.amount),
    description: values.description || undefined
  })
}
</script>
