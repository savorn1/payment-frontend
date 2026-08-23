<template>
  <div>
    <div
      v-if="refreshable || (showColumnToggle && rows.length > 0)"
      class="flex justify-end items-center gap-2 mb-2"
    >
      <UButton
        v-if="refreshable"
        size="xs"
        variant="soft"
        color="neutral"
        icon="i-lucide-refresh-cw"
        :loading="loading"
        @click="emit('refresh')"
      >
        Refresh
      </UButton>

      <UPopover v-if="showColumnToggle && rows.length > 0">
        <UButton size="xs" variant="soft" color="neutral" icon="i-lucide-columns-3">
          Columns
        </UButton>

        <template #content>
          <div class="p-3 space-y-2 min-w-[12rem]">
            <UCheckbox
              v-for="column in columns"
              :key="column.key"
              :model-value="!hiddenColumnKeys.has(column.key)"
              :label="column.label || humanize(column.key)"
              @update:model-value="(v: boolean) => setColumnVisible(column.key, v)"
            />
          </div>
        </template>
      </UPopover>
    </div>

    <div
      v-if="selectable && selected.length > 0"
      class="flex items-center justify-between gap-3 mb-3 rounded-lg bg-primary-50 dark:bg-primary-400/10 px-3 py-2"
    >
      <span class="text-sm text-primary-700 dark:text-primary-300 font-medium">
        {{ selected.length }} selected
      </span>
      <div class="flex items-center gap-2">
        <slot name="bulk-actions" :selected="selected" :clear="() => (selected = [])" />
        <UButton size="xs" variant="ghost" color="neutral" @click="selected = []">
          Clear selection
        </UButton>
      </div>
    </div>

    <div
      v-if="loading && rows.length === 0"
      class="flex flex-col items-center justify-center gap-3 py-14"
    >
      <UIcon name="i-lucide-loader-circle" class="w-6 h-6 text-gray-400 dark:text-gray-500 animate-spin" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
    </div>

    <div v-else-if="rows.length === 0">
      <slot name="empty-state">
        <EmptyState icon="i-lucide-database" title="No data" />
      </slot>
    </div>

    <template v-else>
      <UTable
        :data="rows"
        :columns="uColumns"
        :loading="loading"
        class="hidden sm:block"
        @select="(_e: Event, row: { original: T }) => emit('select', row.original)"
      >
        <template v-if="selectable" #__select-header>
          <UCheckbox
            :model-value="allSelected"
            :indeterminate="someSelected"
            @update:model-value="toggleSelectAll"
            @click.stop
          />
        </template>
        <template v-if="selectable" #__select-cell="{ row }">
          <UCheckbox
            :model-value="isSelected(row.original)"
            @update:model-value="(v: boolean) => toggleRow(row.original, v)"
            @click.stop
          />
        </template>

        <template v-if="numbered" #__rowNumber-header>No.</template>
        <template v-if="numbered" #__rowNumber-cell="{ row }">
          {{ rowNumberStart + row.index + 1 }}
        </template>

        <template v-for="column in visibleColumns" :key="column.key" #[`${column.key}-header`]>
          <button
            v-if="column.sortable"
            type="button"
            class="flex items-center gap-1 font-medium"
            @click="toggleSort(column.key)"
          >
            {{ column.label ?? humanize(column.key) }}
            <UIcon
              :name="sortIcon(column.key)"
              class="w-3.5 h-3.5"
              :class="sort?.column === column.key ? 'opacity-100' : 'opacity-30'"
            />
          </button>
          <span v-else>{{ column.label ?? humanize(column.key) }}</span>
        </template>

        <template v-for="column in visibleColumns" :key="column.key" #[`${column.key}-cell`]="{ row }">
          <slot :name="`${column.key}-data`" :row="row.original">
            <ColumnValue :column="column" :row="row.original" />
          </slot>
        </template>
      </UTable>

      <!-- Mobile fallback: a horizontally-scrolling table is unreadable on narrow
           screens, so stack each row as a label/value card below `sm`. -->
      <div class="sm:hidden space-y-3">
        <div
          v-for="(row, index) in rows"
          :key="index"
          class="rounded-lg border border-gray-200 dark:border-gray-800 p-3"
          :class="{ 'active:bg-gray-50 dark:active:bg-gray-800/50': hasSelectListener }"
          @click="emit('select', row)"
        >
          <div
            v-for="column in visibleColumns"
            :key="column.key"
            class="flex items-start justify-between gap-3 py-1 text-sm first:pt-0 last:pb-0"
          >
            <span class="text-gray-500 dark:text-gray-400 shrink-0">{{
              column.label ?? humanize(column.key)
            }}</span>
            <span class="text-right font-medium text-gray-900 dark:text-white min-w-0">
              <slot :name="`${column.key}-data`" :row="row">
                <ColumnValue :column="column" :row="row" />
              </slot>
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import type { ColumnDef } from '~/shared/types'
import type { TableColumn } from '@nuxt/ui'

const props = withDefaults(
  defineProps<{
    rows: T[]
    columns: ColumnDef<T>[]
    loading?: boolean
    /** Lets users show/hide individual columns via a "Columns" popover. */
    columnsToggleable?: boolean
    /** Shows a "Refresh" button that emits `refresh` — the caller re-fetches. */
    refreshable?: boolean
    /** Adds a leading "No." column, numbered `rowNumberStart + index + 1`. */
    numbered?: boolean
    /** Offset for numbering, e.g. `(page - 1) * pageSize` so it stays continuous across pages. */
    rowNumberStart?: number
    /** Adds a checkbox column and a "N selected" bulk-actions bar (see the
     * `bulk-actions` slot) driven by `v-model:selected`. */
    selectable?: boolean
  }>(),
  {
    columnsToggleable: true,
    refreshable: false,
    numbered: false,
    rowNumberStart: 0,
    selectable: false
  }
)

const selected = defineModel<T[]>('selected', { default: () => [] })
const sort = defineModel<{ column: string; direction: 'asc' | 'desc' } | undefined>('sort')

const emit = defineEmits<{ select: [row: T]; refresh: [] }>()

const attrs = useAttrs()
const hasSelectListener = computed(() => !!attrs.onSelect)

// Hidden-by-key (not index) so visibility survives column list re-renders as
// long as keys stay the same.
const hiddenColumnKeys = ref<Set<string>>(new Set())

const showColumnToggle = computed(() => props.columnsToggleable && props.columns.length > 1)

const visibleColumns = computed(() =>
  props.columns.filter((c) => !hiddenColumnKeys.value.has(c.key))
)

function setColumnVisible(key: string, visible: boolean) {
  // Always leave at least one column visible — hiding the last one would
  // render an empty table with no way back to the toggle.
  if (!visible && visibleColumns.value.length <= 1) return
  const next = new Set(hiddenColumnKeys.value)
  if (visible) next.delete(key)
  else next.add(key)
  hiddenColumnKeys.value = next
}

function toggleSort(key: string) {
  if (sort.value?.column !== key) {
    sort.value = { column: key, direction: 'asc' }
  } else if (sort.value.direction === 'asc') {
    sort.value = { column: key, direction: 'desc' }
  } else {
    sort.value = undefined
  }
}

function sortIcon(key: string) {
  if (sort.value?.column !== key) return 'i-lucide-chevrons-up-down'
  return sort.value.direction === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
}

function isSelected(row: T) {
  return selected.value.includes(row)
}

function toggleRow(row: T, value: boolean) {
  selected.value = value ? [...selected.value, row] : selected.value.filter((r) => r !== row)
}

const allSelected = computed(() => props.rows.length > 0 && selected.value.length === props.rows.length)
const someSelected = computed(() => selected.value.length > 0 && !allSelected.value)

function toggleSelectAll(value: boolean) {
  selected.value = value ? [...props.rows] : []
}

const ROW_NUMBER_KEY = '__rowNumber'
const SELECT_KEY = '__select'

// Every column is a TanStack "display column" (id + header/cell only, no
// accessorKey) — value extraction is already handled by <ColumnValue> and
// formatColumnText(), so there's nothing for TanStack itself to accessor.
const uColumns = computed<TableColumn<T>[]>(() => {
  const cols: TableColumn<T>[] = []
  if (props.selectable) cols.push({ id: SELECT_KEY })
  if (props.numbered) cols.push({ id: ROW_NUMBER_KEY })
  for (const c of visibleColumns.value) {
    cols.push({ id: c.key, meta: { class: { td: c.class } } })
  }
  return cols
})
</script>
