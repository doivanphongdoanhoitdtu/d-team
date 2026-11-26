<template>
  <div
    v-if="!ui.isOnline"
    class="bg-amber-700 text-white text-xs font-medium px-4 py-2 flex items-center justify-between gap-3 no-print"
  >
    <div class="flex items-center gap-2">
      <WifiOff class="w-4 h-4 shrink-0" />
      <span>Không có kết nối Internet. Đang sử dụng dữ liệu lưu tạm trên thiết bị.</span>
    </div>
    <button
      type="button"
      @click="$emit('retry')"
      :disabled="ui.isCheckingNetwork"
      class="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition cursor-pointer shrink-0 disabled:opacity-50"
    >
      {{ ui.isCheckingNetwork ? 'Đang kiểm tra...' : 'Thử lại' }}
    </button>
  </div>
</template>

<script setup>
import { WifiOff } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';

const ui = useUiStore();
defineEmits(['retry']);
</script>
