<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-white">
          Nhật ký &amp; ma trận phân công lịch trực
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {{ viewMode === 'matrix' ? 'Bảng ma trận phân ca ngang theo Ngày / Buổi chuẩn mẫu Excel' : 'Danh sách chi tiết từng ca trực kèm trang sổ gốc' }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs">
        <div class="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">
          <button
            type="button"
            @click="viewMode = 'matrix'"
            class="px-3 py-1.5 rounded-md cursor-pointer"
            :class="viewMode === 'matrix' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
          >
            Ma trận
          </button>
          <button
            type="button"
            @click="viewMode = 'list'"
            class="px-3 py-1.5 rounded-md cursor-pointer"
            :class="viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
          >
            Danh sách
          </button>
        </div>

        <button
          type="button"
          @click="handleExportMatrix"
          class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet class="w-3.5 h-3.5" />
          <span>Xuất ma trận</span>
        </button>
        <button
          type="button"
          @click="handleExportReport"
          class="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Xuất báo cáo</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
      <div class="inline-flex p-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold">
        <button
          type="button"
          @click="dataSource = 'registrations'"
          class="px-2.5 py-1 rounded-md cursor-pointer"
          :class="dataSource === 'registrations' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300'"
        >
          Lịch đăng ký ({{ periodRegs.length }})
        </button>
        <button
          type="button"
          @click="dataSource = 'shifts'"
          class="px-2.5 py-1 rounded-md cursor-pointer"
          :class="dataSource === 'shifts' ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300'"
        >
          Nhật ký sổ gốc ({{ periodShifts.length }})
        </button>
      </div>

      <div class="flex-1 min-w-[240px] grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="keyword"
            type="text"
            placeholder="Tìm tên, MSSV, trang sổ..."
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
          />
        </div>
        <select
          v-model="shiftTypeFilter"
          class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
        >
          <option value="">Tất cả các ca</option>
          <option v-for="st in effectiveShiftTypes" :key="st" :value="st">{{ st }}</option>
        </select>
      </div>

      <span class="text-slate-500 dark:text-slate-400 font-medium tabular-nums">
        {{ matrixDates.length }} ngày trực
      </span>
    </div>

    <!-- Matrix View -->
    <div v-if="viewMode === 'matrix'" class="space-y-2">
      <div v-if="matrixDates.length === 0" class="py-10 text-center text-xs text-slate-400">
        Không có dữ liệu trong khoảng thời gian đã chọn.
      </div>
      <div v-else class="overflow-x-auto max-h-[640px] border border-slate-300 dark:border-slate-700 rounded-lg">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="sticky top-0 z-20">
              <th rowspan="2" class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-center py-2 px-3 border border-slate-300 dark:border-slate-700 sticky left-0 z-30 min-w-[76px]">
                BUỔI
              </th>
              <th rowspan="2" class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-center py-2 px-2 border border-slate-300 dark:border-slate-700 sticky left-[76px] z-30 min-w-[46px]">
                STT
              </th>
              <th
                v-for="d in matrixDates"
                :key="'h_' + d"
                colspan="2"
                class="bg-brand-700 text-white font-bold text-center py-2 px-3 border border-brand-800 whitespace-nowrap min-w-[240px] tabular-nums"
              >
                {{ formatDayMonth(d) }}
              </th>
            </tr>
            <tr class="sticky top-[33px] z-20">
              <template v-for="d in matrixDates" :key="'sub_' + d">
                <th class="bg-brand-50 dark:bg-slate-800 text-brand-900 dark:text-slate-200 font-semibold text-center py-1.5 px-2 border border-slate-300 dark:border-slate-700 text-[11px] min-w-[96px]">
                  MSSV
                </th>
                <th class="bg-brand-50 dark:bg-slate-800 text-brand-900 dark:text-slate-200 font-semibold text-center py-1.5 px-3 border border-slate-300 dark:border-slate-700 text-[11px] min-w-[150px]">
                  HỌ VÀ TÊN
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <template v-for="st in effectiveShiftTypes" :key="st">
              <tr v-for="idx in getBlockRowCount(st)" :key="st + '_' + idx">
                <td
                  v-if="idx === 1"
                  :rowspan="getBlockRowCount(st)"
                  class="bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-bold text-center border border-slate-300 dark:border-slate-700 p-2 sticky left-0 z-10 align-middle whitespace-nowrap"
                >
                  {{ st.toUpperCase() }}
                </td>
                <td class="bg-slate-50 dark:bg-slate-900 text-center font-medium text-slate-500 border border-slate-300 dark:border-slate-700 p-1.5 sticky left-[76px] z-10 tabular-nums">
                  {{ idx }}
                </td>
                <template v-for="d in matrixDates" :key="st + '_' + idx + '_' + d">
                  <td
                    class="border border-slate-200 dark:border-slate-800 px-2 py-1.5 font-mono text-center whitespace-nowrap"
                    :class="isMatched(getStudent(st, d, idx - 1))
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-bold'
                      : 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300'"
                  >
                    {{ getStudent(st, d, idx - 1)?.mssv || '' }}
                  </td>
                  <td
                    class="border border-slate-200 dark:border-slate-800 px-3 py-1.5 whitespace-nowrap"
                    :class="isMatched(getStudent(st, d, idx - 1))
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-bold'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium'"
                  >
                    {{ getStudent(st, d, idx - 1)?.name || '' }}
                  </td>
                </template>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="p-3 font-semibold">STT</th>
            <th class="p-3 font-semibold">MSSV</th>
            <th class="p-3 font-semibold">Họ và tên</th>
            <th class="p-3 font-semibold">Ban</th>
            <th class="p-3 font-semibold">Ngày trực</th>
            <th class="p-3 font-semibold">Ca</th>
            <th v-if="dataSource === 'shifts'" class="p-3 font-semibold">Sổ gốc</th>
            <th v-if="dataSource === 'shifts'" class="p-3 font-semibold">Trạng thái</th>
            <th class="p-3 font-semibold">Ghi chú</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-for="(item, idx) in filteredList" :key="item.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <td class="p-3 text-slate-400 tabular-nums">{{ idx + 1 }}</td>
            <td class="p-3 font-mono font-semibold text-slate-700 dark:text-slate-300">{{ item.memberId }}</td>
            <td class="p-3 font-semibold text-slate-900 dark:text-white">{{ data.getMemberName(item.memberId) }}</td>
            <td class="p-3 text-slate-500">{{ data.getMemberDept(item.memberId) }}</td>
            <td class="p-3 tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">{{ formatDate(item.date) }}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-semibold">
                {{ item.shiftType }}
              </span>
            </td>
            <td v-if="dataSource === 'shifts'" class="p-3 tabular-nums text-slate-600 dark:text-slate-300">
              Tr.{{ item.pageNo }} - STT {{ item.sttNo }}
            </td>
            <td v-if="dataSource === 'shifts'" class="p-3">
              <span
                class="px-2 py-0.5 rounded text-[11px] font-semibold"
                :class="item.status === 'Đúng giờ'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'"
              >
                {{ item.status }}
              </span>
            </td>
            <td class="p-3 text-slate-500 italic">{{ item.notes || '—' }}</td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="9" class="p-8 text-center text-slate-400">Không tìm thấy bản ghi phù hợp.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { FileSpreadsheet, Download, Search } from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';
import { useUiStore } from '../../stores/ui.js';
import { formatDate, formatDayMonth } from '../../utils/date.js';
import { exportShiftsReportExcel, exportShiftScheduleMatrixExcel } from '../../utils/exporters.js';

const data = useDataStore();
const ui = useUiStore();

const viewMode = ref('matrix');
const dataSource = ref('registrations');
const keyword = ref('');
const shiftTypeFilter = ref('');

const periodRegs = computed(() => data.getRegistrationsForPeriod(ui.selectedMonth, ui.selectedWeek));
const periodShifts = computed(() => data.getShiftsForPeriod(ui.selectedMonth, ui.selectedWeek, 'admin'));

const activeList = computed(() =>
  dataSource.value === 'registrations' ? periodRegs.value : periodShifts.value
);

const effectiveShiftTypes = computed(() => {
  const set = new Set(data.shiftTypeNames.length ? data.shiftTypeNames : ['Ca 1', 'Ca 2', 'Ca 3', 'Ca 4']);
  activeList.value.forEach((r) => {
    if (r.shiftType) set.add(r.shiftType);
  });
  return Array.from(set);
});

const matrixDates = computed(() => {
  const set = new Set();
  activeList.value.forEach((r) => {
    if (r.date) set.add(r.date);
  });
  return Array.from(set).sort();
});

const matrixMap = computed(() => {
  const map = {};
  for (const st of effectiveShiftTypes.value) {
    map[st] = {};
    for (const d of matrixDates.value) map[st][d] = [];
  }
  for (const r of activeList.value) {
    const st = r.shiftType || effectiveShiftTypes.value[0] || 'Ca 1';
    if (map[st]?.[r.date]) {
      map[st][r.date].push({
        mssv: r.memberId,
        name: r.memberName || data.getMemberName(r.memberId)
      });
    }
  }
  return map;
});

function getStudent(st, d, idx) {
  return matrixMap.value[st]?.[d]?.[idx] || null;
}

function getBlockRowCount(st) {
  let max = 0;
  for (const d of matrixDates.value) {
    const len = matrixMap.value[st]?.[d]?.length || 0;
    if (len > max) max = len;
  }
  return Math.max(1, max);
}

function isMatched(student) {
  const kw = keyword.value.trim().toLowerCase();
  if (!student || !kw) return false;
  return student.mssv.toLowerCase().includes(kw) || student.name.toLowerCase().includes(kw);
}

const filteredList = computed(() => {
  let list = activeList.value;
  if (shiftTypeFilter.value) {
    list = list.filter((i) => i.shiftType === shiftTypeFilter.value);
  }
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return list;
  return list.filter(
    (i) =>
      data.getMemberName(i.memberId).toLowerCase().includes(kw) ||
      i.memberId.toLowerCase().includes(kw) ||
      String(i.pageNo || '').includes(kw) ||
      String(i.sttNo || '').includes(kw)
  );
});

async function handleExportMatrix() {
  await exportShiftScheduleMatrixExcel({
    registrations: activeList.value,
    monthStr: ui.selectedMonth,
    selectedWeek: ui.selectedWeek,
    shiftTypeNames: data.shiftTypeNames,
    getMemberName: data.getMemberName,
    notify: ui.showToast
  });
}

async function handleExportReport() {
  await exportShiftsReportExcel({
    list: filteredList.value,
    selectedMonth: ui.selectedMonth,
    getMemberName: data.getMemberName,
    getMemberDept: data.getMemberDept,
    notify: ui.showToast
  });
}
</script>
