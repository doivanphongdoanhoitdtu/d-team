<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Nhập danh sách thành viên hàng loạt</h3>
          <button type="button" @click="$emit('close')" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
          <p>
            Mỗi dòng gồm: <strong class="text-slate-800 dark:text-slate-200">MSSV, Họ tên, Ban</strong> (ngăn cách bằng Tab, dấu phẩy hoặc chấm phẩy):
          </p>
          <pre class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">C2300001, Nguyễn Văn An, Ban Hành chính
C2300002, Trần Thị Bình, Ban Nhân sự</pre>
          <textarea
            v-model="rawText"
            rows="7"
            placeholder="Dán dữ liệu từ Excel hoặc danh sách tại đây..."
            class="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="isSaving"
            @click="handleImport"
            class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {{ isSaving ? 'Đang đồng bộ...' : 'Nhập danh sách' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close']);
const data = useDataStore();

const rawText = ref('');
const isSaving = ref(false);

watch(() => props.show, (open) => {
  if (open) rawText.value = '';
});

async function handleImport() {
  isSaving.value = true;
  try {
    const ok = await data.saveBatchMembers(rawText.value);
    if (ok) emit('close');
  } finally {
    isSaving.value = false;
  }
}
</script>
