<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
      <UButton to="/users/new" icon="i-lucide-plus">New user</UButton>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <UInput
        v-model="filter.username"
        placeholder="Search username"
        icon="i-lucide-search"
        class="w-56"
        @keyup.enter="load"
      />
      <USelect
        v-model="filter.role"
        :items="roleFilterOptions"
        placeholder="Role"
        class="w-40"
      />
      <USelect
        v-model="filter.enabled"
        :items="statusFilterOptions"
        placeholder="Status"
        class="w-40"
      />
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      class="mb-4"
      :title="error"
      icon="i-lucide-triangle-alert"
    />

    <DataTable v-model:sort="sort" :rows="rows" :columns="columns" :loading="loading" refreshable numbered @refresh="load">
      <template #role-data="{ row }">
        <USelect
          :model-value="row.role"
          :items="roleOptions"
          :disabled="row.username === myUsername"
          class="w-32"
          @update:model-value="(value: string) => onRoleChange(row, value as Role)"
        />
      </template>
      <template #enabled-data="{ row }">
        <USwitch
          :model-value="row.enabled"
          :disabled="row.username === myUsername"
          @update:model-value="(value: boolean) => onStatusChange(row, value)"
        />
      </template>
      <template #actions-data="{ row }">
        <div class="flex items-center gap-2">
          <UButton
            size="xs"
            color="neutral"
            variant="soft"
            icon="i-lucide-key-round"
            :disabled="row.username === myUsername"
            @click="openResetPasswordWith(row)"
          >
            Reset password
          </UButton>
          <UButton
            size="xs"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            :disabled="row.username === myUsername"
            @click="openDeleteWith(row)"
          >
            Delete
          </UButton>
        </div>
      </template>
    </DataTable>

    <ResetPasswordModal
      v-model="showResetPassword"
      :username="resetTarget?.username ?? ''"
      :loading="resettingPassword"
      :error="resetError"
      @submit="onResetPasswordSubmit"
    />

    <ConfirmModal
      v-model="showDeleteConfirm"
      title="Delete user"
      :description="`Delete user '${deleteTarget?.username ?? ''}'? This cannot be undone.`"
      confirm-label="Delete"
      color="error"
      :loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '~/shared/types'
import type { AdminUser, Role } from '~/composables/useUsers'

definePageMeta({ middleware: 'admin' })

const { list, updateRole, updateStatus, resetPassword, remove } = useUsers()
const { username: myUsername } = useAuth()
const toast = useToast()

const rows = ref<AdminUser[]>([])
const loading = ref(false)
const error = ref('')

const filter = reactive<{ username: string; role: Role | undefined; enabled: boolean | undefined }>({
  username: '',
  role: undefined,
  enabled: undefined
})

const roleOptions = [
  { label: 'User', value: 'USER' },
  { label: 'Admin', value: 'ADMIN' }
]
const roleFilterOptions = [{ label: 'All roles', value: undefined }, ...roleOptions]
const statusFilterOptions = [
  { label: 'All statuses', value: undefined },
  { label: 'Enabled', value: true },
  { label: 'Disabled', value: false }
]

const sort = ref<{ column: string; direction: 'asc' | 'desc' } | undefined>({
  column: 'id',
  direction: 'desc'
})

const columns: ColumnDef<AdminUser>[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'username', sortable: true },
  { key: 'email', value: (row) => row.email ?? '—' },
  { key: 'role' },
  { key: 'enabled', type: 'boolean' },
  { key: 'actions', label: '' }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const page = await list({
      username: filter.username || undefined,
      role: filter.role,
      enabled: filter.enabled,
      sortBy: sort.value?.column,
      sortOrder: sort.value?.direction,
      size: 50
    })
    rows.value = page.data
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function onRoleChange(row: AdminUser, role: Role) {
  if (role === row.role) return
  try {
    const updated = await updateRole(row.id, role)
    row.role = updated.role
    toast.add({ title: 'Role updated', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Could not update role', description: apiErrorMessage(err), color: 'error' })
  }
}

async function onStatusChange(row: AdminUser, enabled: boolean) {
  try {
    const updated = await updateStatus(row.id, enabled)
    row.enabled = updated.enabled
    toast.add({ title: enabled ? 'User enabled' : 'User disabled', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Could not update status', description: apiErrorMessage(err), color: 'error' })
  }
}

const {
  open: showResetPassword,
  target: resetTarget,
  loading: resettingPassword,
  error: resetError,
  openWith: openResetPasswordWith
} = useTargetModal<AdminUser>()

async function onResetPasswordSubmit(newPassword: string) {
  if (!resetTarget.value) return
  resettingPassword.value = true
  resetError.value = ''
  try {
    await resetPassword(resetTarget.value.id, newPassword)
    showResetPassword.value = false
    toast.add({ title: 'Password reset', color: 'success' })
  } catch (err) {
    resetError.value = apiErrorMessage(err)
  } finally {
    resettingPassword.value = false
  }
}

const {
  open: showDeleteConfirm,
  target: deleteTarget,
  loading: deleting,
  openWith: openDeleteWith
} = useTargetModal<AdminUser>()

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await remove(deleteTarget.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleteTarget.value!.id)
    showDeleteConfirm.value = false
    toast.add({ title: 'User deleted', color: 'success' })
  } catch (err) {
    toast.add({ title: 'Could not delete user', description: apiErrorMessage(err), color: 'error' })
  } finally {
    deleting.value = false
  }
}

onMounted(load)
watch(sort, load)
watch(() => [filter.role, filter.enabled], load)
</script>
