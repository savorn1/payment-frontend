<template>
  <UDashboardGroup class="bg-gray-50 dark:bg-gray-950">
    <UDashboardSidebar collapsible :collapsed-size="4" class="bg-white dark:bg-gray-900">
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-center gap-2.5" :class="collapsed ? 'justify-center w-full' : ''">
          <span
            class="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500 text-white shrink-0"
          >
            <UIcon name="i-lucide-banknote" class="w-4 h-4" />
          </span>
          <span v-if="!collapsed" class="font-bold text-gray-900 dark:text-white tracking-tight">
            Payment
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu :collapsed="collapsed" :tooltip="collapsed" :items="items" orientation="vertical" />
      </template>

      <template #footer>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar>
          <template #left>
            <UBreadcrumb :items="breadcrumbItems" />
          </template>

          <template #right>
            <UColorModeButton />
            <UDropdownMenu :items="profileItems" :content="{ align: 'end' }" :ui="{ content: 'w-56' }">
              <UButton size="sm" color="neutral" variant="ghost" trailing-icon="i-lucide-chevron-down">
                <UAvatar :alt="username ?? '?'" size="2xs" />
                {{ username }}
              </UButton>
            </UDropdownMenu>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import type { BreadcrumbItem, DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const { username, role, isAdmin, logout } = useAuth()
const route = useRoute()

const profileItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: username.value ?? '',
      description: role.value === 'ADMIN' ? 'Administrator' : 'User',
      avatar: { alt: username.value ?? '?' },
      type: 'label'
    }
  ],
  [{ label: 'Profile', icon: 'i-lucide-user', to: '/profile' }],
  [{ label: 'Log out', icon: 'i-lucide-log-out', color: 'error', onSelect: () => logout() }]
])

const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Dashboard', to: '/', icon: 'i-lucide-layout-dashboard' },
  { label: 'Wallet', to: '/wallet', icon: 'i-lucide-wallet' },
  { label: 'Deposits', to: '/deposits', icon: 'i-lucide-arrow-down-to-line' },
  { label: 'Withdrawals', to: '/withdrawals', icon: 'i-lucide-arrow-up-from-line' },
  { label: 'Payments', to: '/payments', icon: 'i-lucide-credit-card' },
  ...(isAdmin.value
    ? [
        { label: 'Administration', type: 'label' as const },
        { label: 'Users', to: '/users', icon: 'i-lucide-users' },
        { label: 'Merchant', to: '/merchants', icon: 'i-lucide-store' },
        { label: 'Transfer', to: '/transfers', icon: 'i-lucide-arrow-left-right' },
        { label: 'Gateways', to: '/gateways', icon: 'i-lucide-plug-zap' },
        { label: 'Webhook', to: '/webhooks', icon: 'i-lucide-webhook' },
        { label: 'Fees & Limits', to: '/fees-limits', icon: 'i-lucide-percent' },
        { label: 'Reconciliation', to: '/reconciliation', icon: 'i-lucide-scale' },
        { label: 'Reports', to: '/reports', icon: 'i-lucide-bar-chart-3' }
      ]
    : [])
])

// Derived from the same nav list so it can never drift out of sync with the
// sidebar — walks `items` tracking the last `type: 'label'` group seen (e.g.
// "Administration") as the section a page belongs to.
const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  let section: string | undefined
  for (const item of items.value) {
    if (item.type === 'label') {
      section = item.label
      continue
    }
    if (item.to !== route.path) continue
    return section ? [{ label: section }, { label: item.label, icon: item.icon }] : [{ label: item.label, icon: item.icon }]
  }
  // Routes outside the sidebar nav (e.g. /profile) fall back to the last path segment.
  const segment = route.path.split('/').filter(Boolean).pop()
  return [{ label: segment ? humanize(segment) : 'Dashboard' }]
})
</script>
