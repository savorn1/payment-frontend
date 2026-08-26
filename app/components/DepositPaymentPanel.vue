<template>
  <div>
    <template v-if="deposit.status === 'PENDING'">
      <div class="flex flex-col items-center gap-4 py-2">
        <div class="bg-white p-4 rounded-lg ring-1 ring-gray-200">
          <QrCode :value="deposit.qrCodeData ?? ''" :size="180" />
        </div>
        <UButton
          v-if="deposit.paymentUrl"
          :to="deposit.paymentUrl"
          target="_blank"
          icon="i-lucide-external-link"
          variant="soft"
          color="neutral"
        >
          Open payment page
        </UButton>
        <div class="flex items-center gap-2">
          <StatusBadge :status="deposit.status" />
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-refresh-cw"
            :loading="checking"
            @click="onCheckStatus"
          >
            Refresh status
          </UButton>
        </div>

        <div v-if="deposit.expiresAt" class="flex items-center gap-1.5 text-xs">
          <UIcon
            name="i-lucide-timer"
            class="w-3.5 h-3.5"
            :class="isPastExpiry ? 'text-error' : 'text-gray-400 dark:text-gray-500'"
          />
          <span v-if="!isPastExpiry" class="text-gray-500 dark:text-gray-400 tabular-nums">
            Expires in {{ countdownLabel }}
          </span>
          <span v-else class="text-error">
            Expired — waiting for confirmation, use Refresh status
          </span>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-800">
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Sandbox — this app has no real payment gateway. Use these to simulate the outcome.
        </p>
        <div class="flex gap-2">
          <UButton
            size="xs"
            color="success"
            variant="soft"
            :loading="simulating === 'success'"
            :disabled="!!simulating"
            @click="onSimulate('success')"
          >
            Simulate success
          </UButton>
          <UButton
            size="xs"
            color="error"
            variant="soft"
            :loading="simulating === 'failed'"
            :disabled="!!simulating"
            @click="onSimulate('failed')"
          >
            Simulate failure
          </UButton>
        </div>
        <UAlert v-if="error" color="error" variant="subtle" class="mt-3" :title="error" />
      </div>

      <div class="mt-4 flex justify-end">
        <UButton size="xs" color="error" variant="ghost" :loading="cancelling" @click="onCancel">
          Cancel deposit
        </UButton>
      </div>
    </template>

    <div v-else-if="deposit.status === 'SUCCESS'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
        <UIcon name="i-lucide-check-circle" class="w-9 h-9 text-success" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Deposit successful</p>
      <p class="text-4xl font-semibold text-gray-900 dark:text-white mt-1">{{ formatCurrency(deposit.amount) }}</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">added to your wallet</p>

      <UAlert v-if="error" color="error" variant="subtle" class="mt-4 w-full text-left" :title="error" />

      <UButton v-if="isAdmin" size="xs" color="neutral" variant="ghost" class="mt-4" :loading="refunding" @click="onRefund">
        Refund deposit
      </UButton>
    </div>

    <div v-else-if="deposit.status === 'CANCELLED'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <UIcon name="i-lucide-ban" class="w-9 h-9 text-gray-400" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Deposit cancelled</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">no funds were added to your wallet</p>
    </div>

    <div v-else-if="deposit.status === 'REFUNDED'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <UIcon name="i-lucide-undo-2" class="w-9 h-9 text-gray-400" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Deposit refunded</p>
      <p class="text-4xl font-semibold text-gray-900 dark:text-white mt-1">{{ formatCurrency(deposit.amount) }}</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">reversed from your wallet</p>
    </div>

    <div v-else-if="deposit.status === 'EXPIRED'" class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <UIcon name="i-lucide-timer-off" class="w-9 h-9 text-gray-400" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Checkout link expired</p>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">no funds were added to your wallet — start a new deposit to try again</p>
    </div>

    <div v-else class="flex flex-col items-center text-center py-6">
      <div class="flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
        <UIcon name="i-lucide-x-circle" class="w-9 h-9 text-error" />
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400">Deposit failed</p>
      <p class="text-base font-medium text-gray-900 dark:text-white mt-1">
        {{ deposit.failureReason ?? 'The payment could not be completed.' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Deposit } from '~/composables/useDeposits'

const props = defineProps<{ deposit: Deposit }>()
const emit = defineEmits<{ update: [deposit: Deposit] }>()

const { checkStatus, simulateSuccess, simulateFailed, cancel, refund } = useDeposits()
const { isAdmin } = useAuth()
const toast = useToast()

const checking = ref(false)
const simulating = ref<'success' | 'failed' | ''>('')
const cancelling = ref(false)
const refunding = ref(false)
const error = ref('')

// ── Expiry countdown ─────────────────────────────────────────────────────
// Ticks once a second purely off the wallclock — the deposit doesn't
// actually flip to EXPIRED until the backend's reconciliation sweep next
// runs (see ReconciliationServiceImpl), which can lag the deadline by up to
// reconciliation.interval-ms. So hitting zero here means "the link should no
// longer work," not "the status has updated yet" — Refresh status is still
// what pulls the confirmed state.
const now = ref(Date.now())
let tickHandle: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  tickHandle = setInterval(() => { now.value = Date.now() }, 1000)
})
onUnmounted(() => {
  if (tickHandle) clearInterval(tickHandle)
})

const remainingMs = computed(() => {
  if (!props.deposit.expiresAt) return null
  return new Date(props.deposit.expiresAt).getTime() - now.value
})
const isPastExpiry = computed(() => remainingMs.value !== null && remainingMs.value <= 0)
const countdownLabel = computed(() => {
  if (remainingMs.value === null || remainingMs.value <= 0) return '0:00'
  const totalSeconds = Math.floor(remainingMs.value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})

async function onCheckStatus() {
  checking.value = true
  error.value = ''
  try {
    emit('update', await checkStatus(props.deposit.id))
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    checking.value = false
  }
}

async function onSimulate(outcome: 'success' | 'failed') {
  simulating.value = outcome
  error.value = ''
  try {
    const updated = outcome === 'success' ? await simulateSuccess(props.deposit.id) : await simulateFailed(props.deposit.id)
    emit('update', updated)
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    simulating.value = ''
  }
}

async function onCancel() {
  cancelling.value = true
  error.value = ''
  try {
    emit('update', await cancel(props.deposit.id))
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    cancelling.value = false
  }
}

async function onRefund() {
  refunding.value = true
  error.value = ''
  try {
    emit('update', await refund(props.deposit.id))
    toast.add({ title: 'Deposit refunded', color: 'success' })
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    refunding.value = false
  }
}
</script>
