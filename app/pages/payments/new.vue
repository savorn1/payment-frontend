<template>
  <div class="max-w-xl">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">New payment</h1>

    <DynamicForm
      v-model="form"
      :fields="fields"
      :loading="submitting"
      :error="error"
      cancelable
      @submit="onSubmit"
      @cancel="navigateTo('/payments')"
    />
  </div>
</template>

<script setup lang="ts">
import type { FieldDef } from '#shared/types'

const { create } = usePayments()

const form = ref<Record<string, any>>({})
const submitting = ref(false)
const error = ref('')
const toast = useToast()

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

async function onSubmit(values: Record<string, any>) {
  submitting.value = true
  error.value = ''
  try {
    const payment = await create({
      payeeUserId: Number(values.payeeUserId),
      amount: Number(values.amount),
      description: values.description || undefined
    })
    toast.add({ title: 'Payment created', description: `#${payment.id}`, color: 'success' })
    await navigateTo('/payments')
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    submitting.value = false
  }
}
</script>
