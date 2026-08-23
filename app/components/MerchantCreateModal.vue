<template>
  <UModal v-model:open="open" title="New merchant">
    <template #body>
      <UAlert v-if="error" color="error" variant="subtle" class="mb-4" :title="error" icon="i-lucide-triangle-alert" />

      <UFormField label="User" name="userId" class="mb-4">
        <USelectMenu
          v-model="selectedUserId"
          v-model:search-term="userQuery"
          value-key="value"
          :items="userOptions"
          :loading="searchingUsers"
          placeholder="Search by username"
          icon="i-lucide-search"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Merchant name" name="name">
        <UInput v-model="name" placeholder="e.g. Bob Store" class="w-full" />
      </UFormField>

      <div class="flex justify-end gap-2 mt-4">
        <UButton color="neutral" variant="ghost" :disabled="loading" @click="open = false">Cancel</UButton>
        <UButton :loading="loading" :disabled="!canSubmit" @click="onSubmit">Create</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false })

defineProps<{ loading?: boolean; error?: string }>()
const emit = defineEmits<{ submit: [payload: { userId: number; name: string }] }>()

const { list: listUsers } = useUsers()

const userQuery = ref('')
const users = ref<{ id: number; username: string }[]>([])
const searchingUsers = ref(false)
const selectedUserId = ref<number | undefined>()
const userOptions = computed(() => users.value.map((u) => ({ label: u.username, value: u.id })))

const name = ref('')
const canSubmit = computed(() => selectedUserId.value !== undefined && name.value.trim().length > 0)

let userDebounce: ReturnType<typeof setTimeout> | undefined
watch(userQuery, (query) => {
  if (userDebounce) clearTimeout(userDebounce)
  if (!query || query.trim().length === 0) return
  userDebounce = setTimeout(async () => {
    searchingUsers.value = true
    try {
      const res = await listUsers({ username: query.trim(), size: 10 })
      users.value = res.data
    } catch {
      users.value = []
    } finally {
      searchingUsers.value = false
    }
  }, 300)
})

watch(open, (value) => {
  if (!value) return
  userQuery.value = ''
  users.value = []
  selectedUserId.value = undefined
  name.value = ''
})

function onSubmit() {
  if (selectedUserId.value === undefined) return
  emit('submit', { userId: selectedUserId.value, name: name.value.trim() })
}
</script>
