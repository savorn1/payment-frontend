<template>
  <div>
    <div class="flex items-center gap-4 mb-3 text-xs text-gray-500 dark:text-gray-400">
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-success" />
        Credited
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-info" />
        Debited
      </span>
    </div>

    <svg
      :viewBox="`0 0 ${width} ${height}`"
      class="w-full [&_rect]:transition-opacity [&_rect:hover]:opacity-70"
      :style="{ height: `${height}px` }"
      preserveAspectRatio="none"
    >
      <line :x1="0" :y1="zeroY" :x2="width" :y2="zeroY" class="stroke-gray-200 dark:stroke-gray-800" stroke-width="1" />

      <g v-for="(p, i) in points" :key="p.date">
        <rect
          v-if="p.credited > 0"
          :x="barX(i)"
          :y="creditY(p.credited)"
          :width="barWidth"
          :height="Math.max(1, zeroY - creditY(p.credited))"
          rx="1.5"
          class="fill-success"
        >
          <title>{{ formatDate(p.date) }} — Credited {{ formatCurrency(p.credited) }}</title>
        </rect>
        <rect
          v-if="p.debited > 0"
          :x="barX(i)"
          :y="zeroY"
          :width="barWidth"
          :height="Math.max(1, debitHeight(p.debited))"
          rx="1.5"
          class="fill-info"
        >
          <title>{{ formatDate(p.date) }} — Debited {{ formatCurrency(p.debited) }}</title>
        </rect>
      </g>
    </svg>

    <div class="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
      <span>{{ points[0] ? formatDate(points[0].date) : '' }}</span>
      <span>{{ points.length ? formatDate(points[points.length - 1]!.date) : '' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DailyActivityPoint } from '~/composables/useDashboard'

const props = defineProps<{ points: DailyActivityPoint[] }>()

const width = 600
const height = 180
const zeroY = height / 2
const barGap = 2

const slotWidth = computed(() => width / Math.max(1, props.points.length))
const barWidth = computed(() => Math.max(1, slotWidth.value - barGap))

// Scale both directions off one shared max so a $50 credit and a $50 debit
// render the same bar height — otherwise the chart would misrepresent
// relative magnitude between the two series.
const maxValue = computed(() => {
  const values = props.points.flatMap((p) => [p.credited, p.debited])
  return Math.max(1, ...values)
})

function barX(index: number) {
  return index * slotWidth.value + barGap / 2
}

function creditY(value: number) {
  return zeroY - (value / maxValue.value) * (zeroY - 8)
}

function debitHeight(value: number) {
  return (value / maxValue.value) * (zeroY - 8)
}
</script>
