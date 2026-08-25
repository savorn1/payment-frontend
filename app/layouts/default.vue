<template>
  <UDashboardGroup class="bg-gray-50 dark:bg-gray-950">
    <UDashboardSidebar>
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
        <UNavigationMenu :collapsed="collapsed" :items="items" orientation="vertical" />
      </template>

      <template #footer>
        <UDashboardSidebarCollapse />
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar>
          <template #right>
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
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'

const { username, role, isAdmin, logout } = useAuth()

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
        { label: 'Payment Gateway', to: '/gateways', icon: 'i-lucide-plug-zap' },
        { label: 'Webhook', to: '/webhooks', icon: 'i-lucide-webhook' },
        { label: 'Fees & Limits', to: '/fees-limits', icon: 'i-lucide-percent' },
        { label: 'Reconciliation', to: '/reconciliation', icon: 'i-lucide-scale' },
        { label: 'Reports', to: '/reports', icon: 'i-lucide-bar-chart-3' }
      ]
    : [])
])
</script>
