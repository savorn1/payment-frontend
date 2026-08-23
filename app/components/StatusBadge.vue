<template>
  <UBadge :color="meta.color" variant="subtle" class="gap-1">
    <UIcon :name="meta.icon" class="w-3 h-3" />
    {{ label }}
  </UBadge>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()

type StatusColor = 'success' | 'error' | 'neutral' | 'warning' | 'info'

// Payment-platform-flavored status set — extend as new statuses show up.
const STATUS_META: Record<string, { color: StatusColor; icon: string }> = {
  PENDING: { color: 'warning', icon: 'i-lucide-clock' },
  PROCESSING: { color: 'info', icon: 'i-lucide-loader-circle' },
  SUCCESS: { color: 'success', icon: 'i-lucide-check-circle' },
  COMPLETED: { color: 'success', icon: 'i-lucide-check-circle' },
  PAID: { color: 'success', icon: 'i-lucide-badge-check' },
  APPROVED: { color: 'success', icon: 'i-lucide-check-circle' },
  FAILED: { color: 'error', icon: 'i-lucide-x-circle' },
  REJECTED: { color: 'error', icon: 'i-lucide-x-circle' },
  EXPIRED: { color: 'error', icon: 'i-lucide-triangle-alert' },
  REFUNDED: { color: 'neutral', icon: 'i-lucide-undo-2' },
  REVERSED: { color: 'neutral', icon: 'i-lucide-undo-2' },
  CANCELLED: { color: 'neutral', icon: 'i-lucide-ban' },
  VOIDED: { color: 'neutral', icon: 'i-lucide-ban' },
  DRAFT: { color: 'neutral', icon: 'i-lucide-pencil' },
  UP: { color: 'success', icon: 'i-lucide-check-circle' },
  DOWN: { color: 'error', icon: 'i-lucide-x-circle' },
  DISABLED: { color: 'neutral', icon: 'i-lucide-power-off' }
}

const DEFAULT_META: { color: StatusColor; icon: string } = {
  color: 'neutral',
  icon: 'i-lucide-help-circle'
}

const meta = computed(() => STATUS_META[props.status] ?? DEFAULT_META)
const label = computed(() => formatEnum(props.status))
</script>
