<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Forgot password</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">
      Enter your account email and we'll send you a link to reset your password.
    </p>

    <UForm v-if="!sent" :state="form" class="space-y-4" @submit="onSubmit">
      <UInput
        v-model="form.email"
        type="email"
        placeholder="Email"
        icon="i-lucide-mail"
        size="lg"
        autocomplete="email"
        autofocus
        required
        aria-label="Email"
        class="w-full"
      />

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        :title="error"
        icon="i-lucide-triangle-alert"
      />

      <UButton type="submit" block size="lg" :loading="loading">Send reset link</UButton>
    </UForm>

    <UAlert
      v-else
      color="success"
      variant="subtle"
      title="Check your email"
      description="If that email is registered, we've sent a link to reset your password."
      icon="i-lucide-mail-check"
    />

    <p class="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
      <NuxtLink to="/login" class="text-primary-600 dark:text-primary-400 font-medium">
        Back to sign in
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { forgotPassword } = useAuth()
const form = reactive({ email: '' })
const loading = ref(false)
const error = ref('')
const sent = ref(false)

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await forgotPassword(form.email)
    // Always show the same success state regardless of outcome — the backend
    // itself never reveals whether the email is registered, and the frontend
    // shouldn't re-introduce that signal either.
    sent.value = true
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>
