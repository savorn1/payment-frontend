<template>
  <div>
    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">From date</label>
    <UInput v-model="startDate" type="date" class="w-40" />
  </div>
  <div>
    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">To date</label>
    <UInput v-model="endDate" type="date" class="w-40" />
  </div>
  <div>
    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min amount</label>
    <UInput v-model="minAmount" type="number" step="0.01" placeholder="0.00" class="w-32" />
  </div>
  <div>
    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max amount</label>
    <UInput v-model="maxAmount" type="number" step="0.01" placeholder="0.00" class="w-32" />
  </div>
  <UButton
    v-if="hasAnyFilter"
    size="sm"
    color="neutral"
    variant="ghost"
    icon="i-lucide-x"
    @click="clear"
  >
    Clear
  </UButton>
</template>

<script setup lang="ts">
// Shared date-range + amount-range filter *fields* — deliberately has no
// UCard/layout wrapper of its own so a page with other filter controls
// (status, search, ...) can put all of them inside one shared card/row
// instead of stacking two. Callers wrap this in whatever layout they need —
// see e.g. deposits/index.vue's single filter UCard containing both a status
// USelect and this component's fields side by side.
// Values are plain strings ('yyyy-MM-dd' for dates, matching the native date
// input and what the backend's LocalDate query params expect as-is) so the
// parent can pass them straight through to its filter object.
const startDate = defineModel<string | undefined>('startDate', { default: undefined })
const endDate = defineModel<string | undefined>('endDate', { default: undefined })
const minAmount = defineModel<number | undefined>('minAmount', { default: undefined })
const maxAmount = defineModel<number | undefined>('maxAmount', { default: undefined })

const hasAnyFilter = computed(
  () => !!startDate.value || !!endDate.value || minAmount.value !== undefined || maxAmount.value !== undefined
)

function clear() {
  startDate.value = undefined
  endDate.value = undefined
  minAmount.value = undefined
  maxAmount.value = undefined
}
</script>
