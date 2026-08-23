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
            <UButton to="/profile" size="sm" color="neutral" variant="ghost" icon="i-lucide-user">
              {{ username }}
            </UButton>
            <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-log-out" @click="logout">
              Log out
            </UButton>
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
import type { NavigationMenuItem } from '@nuxt/ui'

const { username, isAdmin, logout } = useAuth()

const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Home', to: '/', icon: 'i-lucide-home' },
  { label: 'Payments', to: '/payments', icon: 'i-lucide-credit-card' },
  ...(isAdmin.value
    ? [
        { label: 'Administration', type: 'label' as const },
        { label: 'Users', to: '/users', icon: 'i-lucide-users' }
      ]
    : [])
])
</script>
