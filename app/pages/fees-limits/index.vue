<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Fees & Limits</h1>

    <UCard class="mb-4">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-arrow-up-from-line" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Withdrawal</h2>
        </div>
      </template>

      <div v-if="loading" class="flex justify-center py-6">
        <UIcon name="i-lucide-loader-circle" class="w-5 h-5 text-gray-400 animate-spin" />
      </div>
      <UAlert v-else-if="loadError" color="error" variant="subtle" :title="loadError" />
      <DynamicForm
        v-else
        v-model="form"
        :fields="fields"
        :loading="saving"
        :error="saveError"
        submit-label="Save"
        @submit="onSave"
      />
    </UCard>

    <UCard class="mb-4">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-arrow-down-to-line" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Deposit</h2>
        </div>
      </template>
      <p class="text-sm text-gray-500 dark:text-gray-400">Deposits are currently free with no transaction limits.</p>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-arrow-left-right" class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transfer</h2>
        </div>
      </template>
      <p class="text-sm text-gray-500 dark:text-gray-400">Transfers are currently free with no transaction limits.</p>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { FieldDef } from '#shared/types'

definePageMeta({ middleware: 'admin' })

const { getWithdrawalConfig, updateWithdrawalConfig } = useFeesLimits()
const toast = useToast()

const loading = ref(true)
const loadError = ref('')
const form = ref<Record<string, any>>({})

const fields: FieldDef[] = [
  { name: 'flatFee', label: 'Flat fee', type: 'currency', required: true, min: 0 },
  {
    name: 'feePercentage',
    label: 'Fee percentage',
    type: 'number',
    required: true,
    min: 0,
    step: 0.0001,
    prefix: '%',
    hint: 'As a fraction, e.g. 0.01 = 1%'
  },
  { name: 'minAmount', label: 'Minimum amount', type: 'currency', required: true, min: 0.01 },
  { name: 'maxAmount', label: 'Maximum amount', type: 'currency', required: true, min: 0.01 },
  { name: 'dailyLimit', label: 'Daily limit', type: 'currency', required: true, min: 0.01 },
  { name: 'monthlyLimit', label: 'Monthly limit', type: 'currency', required: true, min: 0.01 }
]

const saving = ref(false)
const saveError = ref('')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const config = await getWithdrawalConfig()
    form.value = {
      flatFee: config.flatFee,
      feePercentage: config.feePercentage,
      minAmount: config.minAmount,
      maxAmount: config.maxAmount,
      dailyLimit: config.dailyLimit,
      monthlyLimit: config.monthlyLimit
    }
  } catch (err) {
    loadError.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function onSave(values: Record<string, any>) {
  saving.value = true
  saveError.value = ''
  try {
    const config = await updateWithdrawalConfig({
      flatFee: Number(values.flatFee),
      feePercentage: Number(values.feePercentage),
      minAmount: Number(values.minAmount),
      maxAmount: Number(values.maxAmount),
      dailyLimit: Number(values.dailyLimit),
      monthlyLimit: Number(values.monthlyLimit)
    })
    form.value = {
      flatFee: config.flatFee,
      feePercentage: config.feePercentage,
      minAmount: config.minAmount,
      maxAmount: config.maxAmount,
      dailyLimit: config.dailyLimit,
      monthlyLimit: config.monthlyLimit
    }
    toast.add({ title: 'Withdrawal fees & limits updated', color: 'success' })
  } catch (err) {
    saveError.value = apiErrorMessage(err)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
