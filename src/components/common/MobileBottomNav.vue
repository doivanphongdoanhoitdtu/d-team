<template>
  <!-- Mobile Bottom Navigation -->
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 no-print">
    <div class="grid grid-cols-5 h-16">
      <button
        v-for="tab in quickTabs"
        :key="tab.id"
        type="button"
        @click="selectTab(tab.id)"
        class="relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition cursor-pointer"
        :class="ui.currentTab === tab.id
          ? 'text-brand-600 dark:text-brand-400 font-semibold'
          : 'text-slate-500 dark:text-slate-400'"
      >
        <component :is="tab.icon" class="w-5 h-5" />
        <span class="truncate max-w-[64px]">{{ tab.shortLabel }}</span>
        <span
          v-if="tab.badge"
          class="absolute top-1.5 right-3 min-w-[16px] h-4 px-1 rounded-full bg-[#c8102e] text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
        >
          {{ tab.badge }}
        </span>
      </button>

      <button
        type="button"
        @click="ui.showMobileMoreSheet = true"
        class="relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition cursor-pointer"
        :class="isMoreTabActive ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500 dark:text-slate-400'"
      >
        <Menu class="w-5 h-5" />
        <span>Thêm</span>
        <span
          v-if="moreBadgeCount > 0"
          class="absolute top-1.5 right-3 min-w-[16px] h-4 px-1 rounded-full bg-[#c8102e] text-white text-[10px] font-bold flex items-center justify-center tabular-nums"
        >
          {{ moreBadgeCount }}
        </span>
      </button>
    </div>
  </nav>

  <!-- Mobile More Sheet -->
  <Transition name="modal">
    <div
      v-if="ui.showMobileMoreSheet"
      class="lg:hidden fixed inset-0 z-50 bg-slate-900/50 flex items-end"
      @click.self="ui.showMobileMoreSheet = false"
    >
      <div class="w-full bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-4 pb-6 space-y-4 max-h-[82vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div class="text-sm font-bold text-slate-900 dark:text-white">{{ displayName }}</div>
            <div class="text-xs text-slate-500 font-mono">
              {{ auth.loggedInMemberId }} · {{ auth.isAdmin ? 'Quản trị viên' : 'Thành viên' }}
            </div>
          </div>
          <button
            type="button"
            @click="ui.showMobileMoreSheet = false"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="tab in overflowTabs"
            :key="tab.id"
            type="button"
            @click="selectTab(tab.id)"
            class="flex items-center justify-between gap-2 p-3 rounded-lg border text-left text-xs font-semibold transition cursor-pointer"
            :class="ui.currentTab === tab.id
              ? 'bg-brand-50 dark:bg-brand-900/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'"
          >
            <span class="flex items-center gap-2 min-w-0">
              <component :is="tab.icon" class="w-4 h-4 shrink-0" />
              <span class="truncate">{{ tab.label }}</span>
            </span>
            <span
              v-if="tab.badge"
              class="px-1.5 py-0.5 rounded-full bg-[#c8102e] text-white text-[10px] font-bold tabular-nums"
            >
              {{ tab.badge }}
            </span>
          </button>
        </div>

        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          <button
            v-if="auth.isAdmin"
            type="button"
            @click="ui.showMobileMoreSheet = false; ui.showConfigModal = true"
            class="flex-1 py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
          >
            <Settings class="w-4 h-4" />
            <span>Cấu hình</span>
          </button>
          <button
            v-if="auth.isAdmin"
            type="button"
            @click="ui.showMobileMoreSheet = false; ui.showChangePasswordModal = true"
            class="flex-1 py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5"
          >
            <KeyRound class="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>
          <button
            type="button"
            @click="ui.showMobileMoreSheet = false; auth.logout()"
            class="w-full py-2.5 px-3 rounded-lg border border-red-200 dark:border-red-900/60 text-[#c8102e] dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <LogOut class="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import { Menu, X, Settings, KeyRound, LogOut } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';
import { useAuthStore } from '../../stores/auth.js';
import { useDataStore } from '../../stores/data.js';

const props = defineProps({
  allTabs: { type: Array, required: true }
});

const ui = useUiStore();
const auth = useAuthStore();
const data = useDataStore();

const quickTabs = computed(() => props.allTabs.slice(0, 4));
const overflowTabs = computed(() => props.allTabs.slice(4));

const isMoreTabActive = computed(() => overflowTabs.value.some((t) => t.id === ui.currentTab));
const moreBadgeCount = computed(() => overflowTabs.value.reduce((acc, t) => acc + (Number(t.badge) || 0), 0));

const displayName = computed(() => {
  if (auth.loggedInMemberId === 'ADMIN') return 'Quản trị hệ thống';
  return data.getMemberName(auth.loggedInMemberId) || auth.loggedInMemberId;
});

function selectTab(tabId) {
  ui.currentTab = tabId;
  ui.showMobileMoreSheet = false;
}
</script>
