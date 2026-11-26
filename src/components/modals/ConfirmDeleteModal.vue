<template>
  <Transition name="modal">
    <div
      v-if="ui.confirmModal.show"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      @click.self="ui.closeConfirm()"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-xl space-y-4">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/50 text-[#c8102e] dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ui.confirmModal.title }}</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{{ ui.confirmModal.message }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="ui.closeConfirm()"
            class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            @click="ui.executeConfirm()"
            class="px-4 py-2 rounded-lg bg-[#c8102e] hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
          >
            {{ ui.confirmModal.confirmText || 'Xác nhận' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { AlertTriangle } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';

const ui = useUiStore();
</script>
