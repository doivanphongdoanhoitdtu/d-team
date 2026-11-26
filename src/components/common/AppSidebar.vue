<template>
  <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 no-print">
    <!-- Brand Header -->
    <div class="h-16 px-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
      <img :src="logoUrl" alt="Logo ĐVP" class="w-9 h-9 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white p-0.5 shrink-0" />
      <div class="min-w-0">
        <div class="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
          Đội Văn Phòng ĐH
        </div>
        <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          Đoàn - Hội TDTU
        </div>
      </div>
    </div>

    <!-- Navigation Sections -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      <div class="space-y-1">
        <p class="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
          Nghiệp vụ
        </p>
        <button
          v-for="tab in primaryTabs"
          :key="tab.id"
          type="button"
          @click="ui.currentTab = tab.id"
          class="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer"
          :class="ui.currentTab === tab.id
            ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-semibold'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'"
        >
          <span class="flex items-center gap-2.5 min-w-0">
            <component :is="tab.icon" class="w-4 h-4 shrink-0" />
            <span class="truncate">{{ tab.label }}</span>
          </span>
          <span
            v-if="tab.badge"
            class="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-[#c8102e] text-white tabular-nums"
          >
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <div v-if="adminTabs.length > 0" class="space-y-1">
        <p class="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
          Quản trị &amp; Báo cáo
        </p>
        <button
          v-for="tab in adminTabs"
          :key="tab.id"
          type="button"
          @click="ui.currentTab = tab.id"
          class="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer"
          :class="ui.currentTab === tab.id
            ? 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-semibold'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'"
        >
          <span class="flex items-center gap-2.5 min-w-0">
            <component :is="tab.icon" class="w-4 h-4 shrink-0" />
            <span class="truncate">{{ tab.label }}</span>
          </span>
        </button>
      </div>
    </nav>

    <!-- User & Cloud Footer -->
    <div class="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
      <div class="flex items-center justify-between px-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full" :class="data.isCloudConnected ? 'bg-emerald-600' : 'bg-amber-500'"></span>
          <span>{{ data.isCloudConnected ? 'Cloud đồng bộ' : 'Ngoại tuyến' }}</span>
        </span>
        <button
          v-if="auth.isAdmin"
          type="button"
          @click="ui.showConfigModal = true"
          class="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer"
          title="Cấu hình hệ thống"
        >
          <Settings class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
        <div class="w-8 h-8 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {{ initials }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-semibold text-slate-900 dark:text-white truncate">{{ displayName }}</div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
            {{ auth.loggedInMemberId }} · {{ auth.isAdmin ? 'Admin' : 'Thành viên' }}
          </div>
        </div>
      </div>

      <div class="grid gap-1.5" :class="auth.isAdmin ? 'grid-cols-2' : 'grid-cols-1'">
        <button
          v-if="auth.isAdmin"
          type="button"
          @click="ui.showChangePasswordModal = true"
          class="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <KeyRound class="w-3.5 h-3.5" />
          <span>Đổi MK</span>
        </button>
        <button
          type="button"
          @click="auth.logout()"
          class="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-[#c8102e] hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { Settings, KeyRound, LogOut } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';
import { useAuthStore } from '../../stores/auth.js';
import { useDataStore } from '../../stores/data.js';
import { getInitials } from '../../utils/date.js';

const props = defineProps({
  primaryTabs: { type: Array, required: true },
  adminTabs: { type: Array, default: () => [] }
});

const ui = useUiStore();
const auth = useAuthStore();
const data = useDataStore();

const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`;

const displayName = computed(() => {
  if (auth.loggedInMemberId === 'ADMIN') return 'Quản trị hệ thống';
  return data.getMemberName(auth.loggedInMemberId) || auth.loggedInMemberId;
});

const initials = computed(() => getInitials(displayName.value));
</script>
