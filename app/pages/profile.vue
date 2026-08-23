<template>
  <div class="max-w-xl space-y-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

    <section>
      <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Account
      </h2>
      <DynamicForm
        v-model="profileForm"
        :fields="profileFields"
        :loading="savingProfile"
        :error="profileError"
        submit-label="Save"
        @submit="onSaveProfile"
      />
    </section>

    <section>
      <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Change password
      </h2>
      <DynamicForm
        v-model="passwordForm"
        :fields="passwordFields"
        :loading="savingPassword"
        :error="passwordError"
        submit-label="Change password"
        @submit="onChangePassword"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { FieldDef } from '~/shared/types'

const { getProfile, updateProfile, changePassword } = useProfile()
const toast = useToast()

const profileForm = ref<Record<string, any>>({})
const savingProfile = ref(false)
const profileError = ref('')

const passwordForm = ref<Record<string, any>>({})
const savingPassword = ref(false)
const passwordError = ref('')

const profileFields: FieldDef[] = [
  { name: 'username', label: 'Username', disabled: true },
  { name: 'role', label: 'Role', disabled: true },
  { name: 'email', type: 'email', hint: 'Used for password reset links.' }
]

const passwordFields: FieldDef[] = [
  { name: 'currentPassword', label: 'Current password', type: 'password', required: true },
  { name: 'newPassword', label: 'New password', type: 'password', required: true }
]

async function loadProfile() {
  const profile = await getProfile()
  profileForm.value = {
    username: profile.username,
    role: profile.role,
    email: profile.email ?? ''
  }
}

async function onSaveProfile(values: Record<string, any>) {
  savingProfile.value = true
  profileError.value = ''
  try {
    await updateProfile({ email: values.email || '' })
    toast.add({ title: 'Profile updated', color: 'success' })
  } catch (err) {
    profileError.value = apiErrorMessage(err)
  } finally {
    savingProfile.value = false
  }
}

async function onChangePassword(values: Record<string, any>) {
  savingPassword.value = true
  passwordError.value = ''
  try {
    await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
    passwordForm.value = {}
    toast.add({ title: 'Password changed', color: 'success' })
  } catch (err) {
    passwordError.value = apiErrorMessage(err)
  } finally {
    savingPassword.value = false
  }
}

onMounted(loadProfile)
</script>
