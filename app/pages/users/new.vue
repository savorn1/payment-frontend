<template>
  <div class="max-w-xl">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">New user</h1>

    <DynamicForm
      v-model="form"
      :fields="fields"
      :loading="submitting"
      :error="error"
      cancelable
      @submit="onSubmit"
      @cancel="navigateTo('/users')"
    />
  </div>
</template>

<script setup lang="ts">
import type { FieldDef } from '~/shared/types'
import type { CreateUserPayload } from '~/composables/useUsers'

definePageMeta({ middleware: 'admin' })

const { create } = useUsers()

const form = ref<Record<string, any>>({ role: 'USER', enabled: true })
const submitting = ref(false)
const error = ref('')
const toast = useToast()

const fields: FieldDef[] = [
  { name: 'username', required: true },
  { name: 'password', type: 'password', required: true, hint: 'Minimum 6 characters.' },
  { name: 'email', type: 'email', hint: 'Optional — needed for the user to use "forgot password".' },
  {
    name: 'role',
    type: 'select',
    required: true,
    options: [
      { label: 'User', value: 'USER' },
      { label: 'Admin', value: 'ADMIN' }
    ]
  },
  { name: 'enabled', type: 'switch', onLabel: 'Enabled', offLabel: 'Disabled', default: true }
]

async function onSubmit(values: Record<string, any>) {
  submitting.value = true
  error.value = ''
  try {
    const payload: CreateUserPayload = {
      username: values.username,
      password: values.password,
      email: values.email || undefined,
      role: values.role,
      enabled: values.enabled ?? true
    }
    const user = await create(payload)
    toast.add({ title: 'User created', description: user.username, color: 'success' })
    await navigateTo('/users')
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    submitting.value = false
  }
}
</script>
