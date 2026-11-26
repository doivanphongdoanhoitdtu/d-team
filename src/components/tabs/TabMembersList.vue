<template>
  <div class="space-y-4">
    <!-- Header Actions -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-white">
          Danh sách thành viên ({{ data.members.length }})
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Quản lý MSSV, phân ban, vai trò và tiến độ chỉ tiêu tháng {{ ui.selectedMonth }}.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          @click="$emit('open-batch')"
          class="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>Nhập hàng loạt</span>
        </button>
        <button
          type="button"
          @click="$emit('open-member-modal', null)"
          class="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <UserPlus class="w-3.5 h-3.5" />
          <span>Thêm thành viên</span>
        </button>
      </div>
    </div>

    <!-- Filters Toolbar -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm theo họ tên hoặc MSSV..."
            class="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
          />
        </div>

        <select
          v-model="deptFilter"
          class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-600"
        >
          <option value="all">Tất cả các Ban ({{ data.members.length }})</option>
          <option v-for="d in data.departments" :key="d" :value="d">{{ d }}</option>
        </select>

        <select
          v-model="targetFilter"
          class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-600"
        >
          <option value="all">Tất cả chỉ tiêu tháng</option>
          <option value="pass">Đã đạt chỉ tiêu</option>
          <option value="pending">Chưa đạt chỉ tiêu</option>
        </select>
      </div>

      <div class="flex items-center justify-between md:justify-end gap-2 shrink-0">
        <span class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
          {{ filteredMembers.length }} / {{ data.members.length }}
        </span>
        <button
          v-if="searchQuery || deptFilter !== 'all' || targetFilter !== 'all'"
          type="button"
          @click="resetFilters"
          class="text-[#c8102e] dark:text-red-400 font-semibold hover:underline cursor-pointer"
        >
          Đặt lại
        </button>
      </div>
    </div>

    <!-- Members Grid -->
    <div v-if="filteredMembers.length === 0" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center text-xs text-slate-400">
      Không tìm thấy thành viên phù hợp với bộ lọc hiện tại.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      <article
        v-for="m in filteredMembers"
        :key="m.id"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-10 h-10 rounded-lg bg-brand-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {{ getInitials(m.name) }}
              </div>
              <div class="min-w-0">
                <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ m.name }}</h4>
                <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span class="text-xs font-mono font-semibold text-brand-700 dark:text-brand-400">{{ m.id }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    :class="m.role === 'admin'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
                  >
                    {{ m.role === 'admin' ? 'Quản trị viên' : 'Thành viên' }}
                  </span>
                </div>
              </div>
            </div>

            <span class="px-2 py-0.5 rounded border text-[11px] font-medium shrink-0 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {{ m.department || 'Chưa phân ban' }}
            </span>
          </div>

          <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1.5">
            <div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Ngày sinh</span>
              <span class="font-medium text-slate-800 dark:text-slate-200 tabular-nums">{{ m.dob ? formatDate(m.dob) : '—' }}</span>
            </div>
            <div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Đã trực (Tháng {{ ui.selectedMonth }})</span>
              <span class="font-bold tabular-nums" :class="m.actualCount >= m.targetShifts ? 'text-emerald-700 dark:text-emerald-400' : 'text-brand-700 dark:text-brand-400'">
                {{ m.actualCount }} / {{ m.targetShifts }} ca
              </span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="m.actualCount >= m.targetShifts ? 'bg-emerald-600' : 'bg-brand-600'"
                :style="{ width: m.progressPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <span
            class="font-semibold"
            :class="m.actualCount >= m.targetShifts ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'"
          >
            {{ m.actualCount >= m.targetShifts ? 'Đã đạt chỉ tiêu' : `Còn thiếu ${m.targetShifts - m.actualCount} ca` }}
          </span>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="$emit('open-member-modal', m)"
              class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Sửa
            </button>
            <button
              type="button"
              @click="askDelete(m)"
              class="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:border-red-300 hover:text-[#c8102e] text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
            >
              Xóa
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Upload, UserPlus, Search } from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';
import { useUiStore } from '../../stores/ui.js';
import { formatDate, getInitials, isDateInSelectedMonth } from '../../utils/date.js';

defineEmits(['open-batch', 'open-member-modal']);

const data = useDataStore();
const ui = useUiStore();

const searchQuery = ref('');
const deptFilter = ref('all');
const targetFilter = ref('all');

// Compute O(N) monthly counts accurately (fixes old null-ref bug!)
const enrichedMembers = computed(() => {
  const shiftCounts = new Map();
  for (const s of data.shifts) {
    if (isDateInSelectedMonth(s.date, ui.selectedMonth)) {
      shiftCounts.set(s.memberId, (shiftCounts.get(s.memberId) || 0) + 1);
    }
  }

  return data.members.map((m) => {
    const actualCount = shiftCounts.get(m.id) || 0;
    const targetShifts = Number(m.targetShifts) || 10;
    return {
      ...m,
      actualCount,
      targetShifts,
      progressPercent: Math.min(100, Math.round((actualCount / targetShifts) * 100))
    };
  });
});

const filteredMembers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return enrichedMembers.value.filter((m) => {
    if (q && !m.name.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q)) return false;
    if (deptFilter.value !== 'all' && m.department !== deptFilter.value) return false;
    if (targetFilter.value === 'pass' && m.actualCount < m.targetShifts) return false;
    if (targetFilter.value === 'pending' && m.actualCount >= m.targetShifts) return false;
    return true;
  });
});

function resetFilters() {
  searchQuery.value = '';
  deptFilter.value = 'all';
  targetFilter.value = 'all';
}

function askDelete(m) {
  ui.openConfirm({
    title: 'Xóa thành viên?',
    message: `Bạn có chắc muốn xóa thành viên ${m.name} (${m.id}) khỏi danh sách Đội?`,
    confirmText: 'Xóa thành viên',
    action: () => data.deleteMember(m)
  });
}
</script>
