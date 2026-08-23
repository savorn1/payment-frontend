<template>
  <div :class="bordered ? 'rounded-xl border border-gray-200 dark:border-gray-800 p-5 max-w-xs' : 'flex items-center justify-between'">
    <p class="text-sm text-gray-500 dark:text-gray-400" :class="bordered ? 'mb-3' : ''">
      You don't have a wallet yet.
    </p>
    <UButton size="sm" :loading="loading" @click="emit('create')">Create wallet</UButton>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ loading?: boolean; bordered?: boolean }>(), { bordered: true })
const emit = defineEmits<{ create: [] }>()
</script>
