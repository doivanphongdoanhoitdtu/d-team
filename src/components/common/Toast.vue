<template>
  <Transition name="toast">
    <div
      v-if="ui.toast.show"
      role="status"
      aria-live="polite"
      class="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-[100] flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium bg-white dark:bg-slate-900"
      :class="variantClasses"
    >
      <component :is="variantIcon" class="w-4 h-4 mt-0.5 shrink-0" :class="iconColorClass" />
      <span class="flex-1 text-slate-800 dark:text-slate-100 leading-snug">{{ ui.toast.message }}</span>
      <button
        type="button"
        @click="ui.toast.show = false"
        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
        aria-label="Đóng thông báo"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';

const ui = useUiStore();

const variantClasses = computed(() => {
  switch (ui.toast.type) {
    case 'error':
      return 'border-red-300 dark:border-red-800 border-l-4 border-l-[#c8102e]';
    case 'warning':
      return 'border-amber-300 dark:border-amber-800 border-l-4 border-l-amber-600';
    case 'info':
      return 'border-brand-200 dark:border-brand-800 border-l-4 border-l-brand-600';
    default:
      return 'border-emerald-300 dark:border-emerald-800 border-l-4 border-l-emerald-600';
  }
});

const iconColorClass = computed(() => {
  switch (ui.toast.type) {
    case 'error': return 'text-[#c8102e] dark:text-red-400';
    case 'warning': return 'text-amber-600 dark:text-amber-400';
    case 'info': return 'text-brand-600 dark:text-brand-400';
    default: return 'text-emerald-600 dark:text-emerald-400';
  }
});

const variantIcon = computed(() => {
  switch (ui.toast.type) {
    case 'error': return AlertCircle;
    case 'warning': return AlertTriangle;
    case 'info': return Info;
    default: return CheckCircle2;
  }
});
</script>
