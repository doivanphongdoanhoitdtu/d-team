<template>
  <Transition name="modal">
    <div
      v-if="ui.showShiftSettingsModal"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
      @click.self="ui.showShiftSettingsModal = false"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xl w-full p-5 shadow-xl space-y-4 my-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Cấu hình ca trực &amp; giới hạn đăng ký</h3>
            <p class="text-xs text-slate-500 mt-0.5">Thiết lập cổng đăng ký, định mức và danh sách khung giờ trực.</p>
          </div>
          <button type="button" @click="ui.showShiftSettingsModal = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4 max-h-[62vh] overflow-y-auto pr-1 text-xs">
          <!-- Open/Close Portal -->
          <div class="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-slate-900 dark:text-white">Trạng thái cổng đăng ký ca trực</p>
              <p class="text-[11px] text-slate-500 mt-0.5">
                {{ local.isRegistrationOpen ? 'Đang mở cho thành viên tự đăng ký.' : 'Đang tạm khóa với thành viên.' }}
              </p>
            </div>
            <button
              type="button"
              @click="local.isRegistrationOpen = !local.isRegistrationOpen"
              class="px-3 py-1.5 rounded-lg font-semibold text-white cursor-pointer shrink-0"
              :class="local.isRegistrationOpen ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-[#c8102e] hover:bg-red-700'"
            >
              {{ local.isRegistrationOpen ? 'Đang mở' : 'Đang đóng' }}
            </button>
          </div>

          <!-- Max per shift & per day -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <label class="block font-semibold text-slate-800 dark:text-slate-200">Số người tối đa / ca</label>
              <input
                v-model.number="local.maxPerShift"
                type="number"
                min="0"
                max="100"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-brand-600"
              />
              <p class="text-[11px] text-slate-500">Nhập 0 để không giới hạn số người.</p>
            </div>

            <div class="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <label class="block font-semibold text-slate-800 dark:text-slate-200">Số ca tối đa / người / ngày</label>
              <input
                v-model.number="local.maxPerDay"
                type="number"
                min="0"
                max="20"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-brand-600"
              />
              <p class="text-[11px] text-slate-500">Nhập 0 để không giới hạn số ca/ngày.</p>
            </div>
          </div>

          <!-- Shift Types List -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-semibold text-slate-800 dark:text-slate-200">Danh sách khung ca trực</label>
              <button
                type="button"
                @click="addShiftRow"
                class="px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
              >
                + Thêm ca
              </button>
            </div>

            <div class="space-y-2">
              <div
                v-for="(st, idx) in local.shiftTypes"
                :key="idx"
                class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <span class="w-5 text-center text-slate-400 tabular-nums">{{ idx + 1 }}</span>
                <input
                  v-model="st.name"
                  type="text"
                  placeholder="Tên ca (VD: Ca 1)"
                  class="w-32 px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-600"
                />
                <input
                  v-model="st.time"
                  type="text"
                  placeholder="Khung giờ (VD: 7h30 - 9h20)"
                  class="flex-1 px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
                />
                <button
                  type="button"
                  :disabled="local.shiftTypes.length <= 1"
                  @click="local.shiftTypes.splice(idx, 1)"
                  class="p-1.5 text-slate-400 hover:text-[#c8102e] disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            @click="resetDefaults"
            class="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
          >
            Khôi phục mặc định
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              @click="ui.showShiftSettingsModal = false"
              class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              @click="handleSave"
              class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { X, Trash2 } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';
import { useDataStore } from '../../stores/data.js';
import { DEFAULT_SHIFT_SETTINGS } from '../../utils/normalizers.js';

const ui = useUiStore();
const data = useDataStore();

const local = ref(JSON.parse(JSON.stringify(DEFAULT_SHIFT_SETTINGS)));

watch(
  () => ui.showShiftSettingsModal,
  (open) => {
    if (open) {
      local.value = JSON.parse(JSON.stringify(data.shiftSettings));
    }
  }
);

function addShiftRow() {
  const n = local.value.shiftTypes.length + 1;
  local.value.shiftTypes.push({ id: `Ca ${n}`, name: `Ca ${n}`, time: '' });
}

function resetDefaults() {
  local.value = JSON.parse(JSON.stringify(DEFAULT_SHIFT_SETTINGS));
}

async function handleSave() {
  const cleanTypes = local.value.shiftTypes
    .filter((st) => st.name && st.name.trim())
    .map((st) => ({ id: st.name.trim(), name: st.name.trim(), time: (st.time || '').trim() }));

  const ok = await data.saveShiftSettings({
    isRegistrationOpen: local.value.isRegistrationOpen !== false,
    maxPerShift: Math.max(0, Number(local.value.maxPerShift) || 0),
    maxPerDay: Math.max(0, Number(local.value.maxPerDay) || 0),
    shiftTypes: cleanTypes.length ? cleanTypes : DEFAULT_SHIFT_SETTINGS.shiftTypes
  });
  if (ok) ui.showShiftSettingsModal = false;
}
</script>
