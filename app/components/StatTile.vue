<template>
  <UCard>
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</p>
        <p class="text-2xl font-semibold text-gray-900 dark:text-white mt-1 truncate">{{ value }}</p>
        <p v-if="sublabel" class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ sublabel }}</p>
      </div>
      <div class="shrink-0 rounded-lg bg-primary-50 dark:bg-primary-400/10 p-2">
        <UIcon :name="icon" class="w-5 h-5 text-primary-500 dark:text-primary-400" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
  sublabel?: string
  icon: string
}>()
</script>
