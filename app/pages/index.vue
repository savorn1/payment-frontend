<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      Welcome{{ username ? `, ${username}` : '' }}
    </h1>

    <UAlert
      v-if="error && !walletMissing"
      color="error"
      variant="subtle"
      class="mb-4"
      :title="error"
      icon="i-lucide-triangle-alert"
    />

    <div v-else-if="walletMissing" class="rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6 max-w-xs">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        You don't have a wallet yet.
      </p>
      <UButton size="sm" :loading="creating" @click="onCreateWallet">Create wallet</UButton>
    </div>

    <div v-else class="rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6 max-w-xs">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Wallet balance</p>
      <p v-if="loading" class="text-2xl font-bold text-gray-300 dark:text-gray-700">···</p>
      <p v-else class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ formatCurrency(wallet?.availableBalance) }}
      </p>
    </div>

    <UButton to="/payments" icon="i-lucide-arrow-right" trailing>View payments</UButton>
  </div>
</template>

<script setup lang="ts">
const { username } = useAuth()
const { getMine, createMine } = useWallet()

const wallet = ref<Awaited<ReturnType<typeof getMine>>>()
const loading = ref(true)
const creating = ref(false)
const error = ref('')
const walletMissing = ref(false)

async function loadWallet() {
  loading.value = true
  error.value = ''
  walletMissing.value = false
  try {
    wallet.value = await getMine()
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) {
      walletMissing.value = true
    } else {
      error.value = apiErrorMessage(err)
    }
  } finally {
    loading.value = false
  }
}

async function onCreateWallet() {
  creating.value = true
  try {
    wallet.value = await createMine()
    walletMissing.value = false
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    creating.value = false
  }
}

onMounted(loadWallet)
</script>
