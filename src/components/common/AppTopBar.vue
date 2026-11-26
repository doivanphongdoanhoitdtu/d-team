<template>
  <header class="sticky top-0 z-20 h-14 lg:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 no-print">
    <!-- Left: Mobile Logo + Page Title -->
    <div class="flex items-center gap-3 min-w-0">
      <img
        :src="logoUrl"
        alt="Logo ĐVP"
        class="lg:hidden w-8 h-8 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0"
      />
      <div class="min-w-0">
        <h1 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
          {{ activeTabTitle }}
        </h1>
        <p class="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
          {{ activeTabSubtitle }}
        </p>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <!-- Cloud dot on mobile -->
      <span
        class="lg:hidden inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border"
        :class="data.isCloudConnected
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'"
      >
        <span class="w-1.5 h-1.5 rounded-full" :class="data.isCloudConnected ? 'bg-emerald-600' : 'bg-amber-500'"></span>
        <span class="hidden xs:inline">{{ data.isCloudConnected ? 'Cloud' : 'Offline' }}</span>
      </span>

      <!-- Notification Bell -->
      <button
        type="button"
        @click="ui.showNotificationModal = true"
        class="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        title="Thông báo & nhắc ca"
        aria-label="Thông báo"
      >
        <Bell class="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        <span
          v-if="unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#c8102e] text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Dark Mode Toggle -->
      <button
        type="button"
        @click="ui.toggleTheme()"
        class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        :title="ui.isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
        aria-label="Đổi giao diện sáng tối"
      >
        <Sun v-if="ui.isDarkMode" class="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        <Moon v-else class="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      </button>

      <!-- Admin Settings (desktop shortcut) -->
      <button
        v-if="auth.isAdmin"
        type="button"
        @click="ui.showConfigModal = true"
        class="hidden sm:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        title="Cấu hình hệ thống"
        aria-label="Cấu hình hệ thống"
      >
        <Settings class="w-[18px] h-[18px]" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { Bell, Sun, Moon, Settings } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';
import { useAuthStore } from '../../stores/auth.js';
import { useDataStore } from '../../stores/data.js';

defineProps({
  activeTabTitle: { type: String, default: '' },
  activeTabSubtitle: { type: String, default: '' },
  unreadCount: { type: Number, default: 0 }
});

const ui = useUiStore();
const auth = useAuthStore();
const data = useDataStore();

const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`;
</script>
