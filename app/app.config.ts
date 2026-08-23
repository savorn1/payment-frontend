// Presets for DataTable's table style (see useTableTheme). `ui` is a partial
// UTable `:ui` prop — Table.vue merges each slot's classes with its own
// computed defaults (`ui.th({ class: [props.ui?.th, ...] })`), so overrides
// here only ever add classes, never need `!important` or raw CSS selectors.
//
// `rowEvenClass` covers zebra striping, which UTable has no slot for since it
// styles every row uniformly — DataTable applies it per-row itself via the
// table's `meta.class.tr` hook (a function of the TanStack row).
//
// `sortButtonClass` isn't part of UTable's `ui` at all: DataTable renders its
// own sort toggle button (not UTable's built-in column-sort UI), so DataTable
// applies this directly as a class on that button.
export default defineAppConfig({
  tableThemes: {
    plain: {
      ui: {},
      rowEvenClass: '',
      sortButtonClass: ''
    },
    striped: {
      ui: {},
      rowEvenClass: 'bg-gray-50 dark:bg-gray-800/40',
      sortButtonClass: ''
    },
    bordered: {
      rowEvenClass: '',
      sortButtonClass: 'font-semibold',
      ui: {
        th: 'text-white bg-primary-500 dark:bg-primary-600 border border-primary-400 dark:border-primary-800',
        td: 'border border-gray-200 dark:border-gray-800'
      }
    }
  }
})
