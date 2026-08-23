<template>
  <div class="max-w-xl space-y-6">
    <div class="flex items-center gap-4">
      <UAvatar :text="avatarInitial" size="xl" />
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ profile?.username ?? 'Profile' }}
        </h1>
        <div class="flex items-center gap-2 mt-1">
          <UBadge v-if="profile" :color="profile.role === 'ADMIN' ? 'primary' : 'neutral'" variant="subtle">
            {{ profile.role }}
          </UBadge>
          <span v-if="profile?.email" class="text-sm text-gray-500 dark:text-gray-400">{{ profile.email }}</span>
        </div>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-wallet" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Wallet balance
          </h2>
        </div>
      </template>

      <UAlert
        v-if="walletError"
        color="error"
        variant="subtle"
        :title="walletError"
        icon="i-lucide-triangle-alert"
      />

      <WalletMissingPrompt v-else-if="walletMissing" :loading="creatingWallet" :bordered="false" @create="onCreateWallet" />

      <div v-else class="flex items-center justify-between">
        <p class="text-3xl font-semibold text-gray-900 dark:text-white">
          {{ walletLoading ? '···' : formatCurrency(wallet?.availableBalance) }}
        </p>
        <UButton to="/wallet" variant="soft" color="neutral" icon="i-lucide-arrow-right" trailing size="sm">
          View wallet
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user-round" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Account
          </h2>
        </div>
      </template>
      <DynamicForm
        v-model="profileForm"
        :fields="profileFields"
        :loading="savingProfile"
        :error="profileError"
        submit-label="Save"
        @submit="onSaveProfile"
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-palette" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Preferences
          </h2>
        </div>
      </template>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Choose how tables look across the app.
      </p>
      <UTabs
        :model-value="theme"
        :items="tableStyleItems"
        :content="false"
        class="w-full"
        @update:model-value="(value) => onTableStyleChange(value as TableTheme)"
      />
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-shield-check" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Security
          </h2>
        </div>
      </template>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Change your password to keep your account secure.
      </p>
      <UButton color="neutral" variant="soft" icon="i-lucide-key-round" @click="showChangePassword = true">
        Change password
      </UButton>
    </UCard>

    <ChangePasswordModal
      v-model="showChangePassword"
      :loading="savingPassword"
      :error="passwordError"
      @submit="onChangePassword"
    />
  </div>
</template>

<script setup lang="ts">
import type { FieldDef } from '#shared/types'
import type { Profile } from '~/composables/useProfile'
import type { TableTheme } from '~/composables/useTableTheme'

const { getProfile, updateProfile, changePassword } = useProfile()
const { getMine, createMine } = useWallet()
const { theme, setTheme } = useTableTheme()
const toast = useToast()

const profile = ref<Profile | null>(null)
const avatarInitial = computed(() => profile.value?.username.charAt(0).toUpperCase() ?? '')

const wallet = ref<Awaited<ReturnType<typeof getMine>>>()
const walletLoading = ref(true)
const creatingWallet = ref(false)
const walletError = ref('')
const walletMissing = ref(false)

async function loadWallet() {
  walletLoading.value = true
  walletError.value = ''
  walletMissing.value = false
  try {
    wallet.value = await getMine()
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      walletMissing.value = true
    } else {
      walletError.value = apiErrorMessage(err)
    }
  } finally {
    walletLoading.value = false
  }
}

async function onCreateWallet() {
  creatingWallet.value = true
  try {
    wallet.value = await createMine()
    walletMissing.value = false
  } catch (err) {
    walletError.value = apiErrorMessage(err)
  } finally {
    creatingWallet.value = false
  }
}

const tableStyleItems: { label: string; value: TableTheme; icon: string }[] = [
  { label: 'Plain', value: 'plain', icon: 'i-lucide-square' },
  { label: 'Striped', value: 'striped', icon: 'i-lucide-rows-3' },
  { label: 'Bordered', value: 'bordered', icon: 'i-lucide-table' }
]

const profileForm = ref<Record<string, any>>({})
const savingProfile = ref(false)
const profileError = ref('')

const showChangePassword = ref(false)
const savingPassword = ref(false)
const passwordError = ref('')

const profileFields: FieldDef[] = [
  { name: 'email', type: 'email', hint: 'Used for password reset links.' }
]

async function loadProfile() {
  profile.value = await getProfile()
  profileForm.value = { email: profile.value.email ?? '' }
}

async function onSaveProfile(values: Record<string, any>) {
  savingProfile.value = true
  profileError.value = ''
  try {
    profile.value = await updateProfile({ email: values.email || '' })
    toast.add({ title: 'Profile updated', color: 'success' })
  } catch (err) {
    profileError.value = apiErrorMessage(err)
  } finally {
    savingProfile.value = false
  }
}

async function onChangePassword(payload: { currentPassword: string; newPassword: string }) {
  savingPassword.value = true
  passwordError.value = ''
  try {
    await changePassword(payload)
    showChangePassword.value = false
    toast.add({ title: 'Password changed', color: 'success' })
  } catch (err) {
    passwordError.value = apiErrorMessage(err)
  } finally {
    savingPassword.value = false
  }
}

async function onTableStyleChange(value: TableTheme) {
  try {
    await setTheme(value)
  } catch (err) {
    toast.add({ title: 'Could not save table style', description: apiErrorMessage(err), color: 'error' })
  }
}

onMounted(() => {
  loadProfile()
  loadWallet()
})
</script>
