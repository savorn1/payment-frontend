<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div :style="{ width: `${size}px`, height: `${size}px` }" class="[&_svg]:block [&_svg]:w-full [&_svg]:h-full" v-html="svg" />
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

// QR codes need light-on-dark contrast to scan reliably regardless of the
// app's theme, so colors are fixed rather than following dark mode — the
// parent wraps this in a white box for the same reason.
const props = withDefaults(defineProps<{ value: string; size?: number }>(), { size: 200 })

const svg = ref('')

async function render() {
  if (!props.value) {
    svg.value = ''
    return
  }
  svg.value = await QRCode.toString(props.value, {
    type: 'svg',
    margin: 1,
    color: { dark: '#111827', light: '#ffffff' }
  })
}

watch(() => props.value, render, { immediate: true })
</script>
