<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Reset password</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">Choose a new password for your account</p>

    <UAlert
      v-if="!token"
      color="error"
      variant="subtle"
      title="Invalid reset link"
      description="This link is missing its token. Request a new one below."
      icon="i-lucide-triangle-alert"
      class="mb-4"
    />

    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UInput
        v-model="form.newPassword"
        :type="showPassword ? 'text' : 'password'"
        placeholder="New password"
        icon="i-lucide-lock"
        size="lg"
        autocomplete="new-password"
        autofocus
        required
        :disabled="!token"
        aria-label="New password"
        class="w-full"
      >
        <template #trailing>
          <UButton
            color="neutral"
            variant="link"
            :padded="false"
            :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          />
        </template>
      </UInput>
      <UInput
        v-model="form.confirmPassword"
        :type="showPassword ? 'text' : 'password'"
        placeholder="Confirm new password"
        icon="i-lucide-lock"
        size="lg"
        autocomplete="new-password"
        required
        :disabled="!token"
        aria-label="Confirm new password"
        class="w-full"
      />

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        :title="error"
        icon="i-lucide-triangle-alert"
      />

      <UButton type="submit" block size="lg" :loading="loading" :disabled="!token">
        Reset password
      </UButton>
    </UForm>

    <p class="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
      <NuxtLink to="/forgot-password" class="text-primary-600 dark:text-primary-400 font-medium">
        Request a new link
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { resetPassword } = useAuth()
const route = useRoute()
const toast = useToast()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const form = reactive({ newPassword: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

async function onSubmit() {
  error.value = ''
  if (form.newPassword !== form.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }
  loading.value = true
  try {
    await resetPassword({ token: token.value, newPassword: form.newPassword })
    toast.add({ title: 'Password reset', description: 'Sign in with your new password.', color: 'success' })
    await navigateTo('/login')
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>
