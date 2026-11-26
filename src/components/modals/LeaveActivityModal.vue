<template>
  <Transition name="modal">
    <div
      v-if="show && activity"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Xin nghỉ hoạt động</h3>
            <p class="text-xs text-slate-500 truncate mt-0.5">{{ activity.name }}</p>
          </div>
          <button type="button" @click="$emit('close')" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Shifts Selection -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-semibold text-slate-700 dark:text-slate-300">
                Chọn ca xin nghỉ <span class="text-[#c8102e]">*</span>
              </label>
              <button
                v-if="registeredShifts.length > 1"
                type="button"
                @click="toggleAll"
                class="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                {{ isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả' }}
              </button>
            </div>

            <div v-if="registeredShifts.length > 0" class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              <label
                v-for="r in registeredShifts"
                :key="r.id"
                class="flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition"
                :class="selectedIds.includes(r.id)
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'"
              >
                <div class="flex items-center gap-2.5">
                  <input type="checkbox" :value="r.id" v-model="selectedIds" class="rounded accent-brand-600 cursor-pointer" />
                  <span class="font-semibold tabular-nums">{{ formatDate(r.date) }} · {{ r.shiftType }}</span>
                </div>
              </label>
            </div>

            <div v-else class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              Xin nghỉ toàn bộ hoạt động ngày <strong class="tabular-nums">{{ formatDate(activity.date) }}</strong>.
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Lý do xin nghỉ <span class="text-[#c8102e]">*</span>
            </label>
            <textarea
              v-model="reason"
              rows="3"
              placeholder="Nêu rõ lý do xin nghỉ..."
              class="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="!canSubmit"
            @click="handleSubmit"
            class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            Gửi đơn xin nghỉ
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';
import { useAuthStore } from '../../stores/auth.js';
import { formatDate } from '../../utils/date.js';

const props = defineProps({
  show: Boolean,
  activity: { type: Object, default: null }
});
const emit = defineEmits(['close']);

const data = useDataStore();
const auth = useAuthStore();

const reason = ref('');
const selectedIds = ref([]);

const registeredShifts = computed(() => {
  if (!props.activity || !auth.loggedInMemberId) return [];
  return data.activityRegistrations.filter(
    (r) => r.activityId === props.activity.id && r.memberId === auth.loggedInMemberId
  );
});

watch(() => props.show, (open) => {
  if (open) {
    reason.value = '';
    selectedIds.value = registeredShifts.value.map((r) => r.id);
  }
});

const isAllSelected = computed(
  () => registeredShifts.value.length > 0 && selectedIds.value.length === registeredShifts.value.length
);

function toggleAll() {
  selectedIds.value = isAllSelected.value ? [] : registeredShifts.value.map((r) => r.id);
}

const canSubmit = computed(() => {
  if (!reason.value.trim()) return false;
  if (registeredShifts.value.length > 0 && selectedIds.value.length === 0) return false;
  return true;
});

async function handleSubmit() {
  if (!canSubmit.value || !props.activity) return;
  const chosen = registeredShifts.value.filter((r) => selectedIds.value.includes(r.id));
  await data.submitActivityLeave(props.activity, {
    reason: reason.value.trim(),
    selectedShiftIds: selectedIds.value,
    selectedShifts: chosen
  });
  emit('close');
}
</script>
