<template>
  <div class="space-y-5">
    <!-- Summary KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <button
        type="button"
        @click="filterType = 'duty'"
        class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border text-left transition cursor-pointer"
        :class="filterType === 'duty' ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ca trực tuần</p>
        <p class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{{ myDutyShifts.length }}</p>
      </button>

      <button
        type="button"
        @click="filterType = 'activity'"
        class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border text-left transition cursor-pointer"
        :class="filterType === 'activity' ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ca hoạt động</p>
        <p class="text-2xl font-bold text-brand-700 dark:text-brand-400 tabular-nums mt-0.5">{{ myActivityShifts.length }}</p>
      </button>

      <button
        type="button"
        @click="filterType = 'upcoming'"
        class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border text-left transition cursor-pointer"
        :class="filterType === 'upcoming' ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Sắp diễn ra</p>
        <p class="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">{{ upcomingCount }}</p>
      </button>

      <button
        type="button"
        @click="filterType = 'today'"
        class="p-3.5 rounded-xl bg-white dark:bg-slate-900 border text-left transition cursor-pointer"
        :class="filterType === 'today' ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'"
      >
        <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Hôm nay</p>
        <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">{{ todayCount }}</p>
      </button>
    </div>

    <!-- Filter Toolbar -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <div class="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">
        <button
          v-for="opt in filterOptions"
          :key="opt.id"
          type="button"
          @click="filterType = opt.id"
          class="px-3 py-1.5 rounded-md cursor-pointer transition"
          :class="filterType === opt.id ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="relative flex-1 min-w-[200px] max-w-xs">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="Tìm theo ngày, ca, tên hoạt động..."
          class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
        />
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="ui.currentTab = 'register'"
          class="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
        >
          Đăng ký ca trực
        </button>
        <button
          type="button"
          @click="ui.currentTab = 'activities'"
          class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 cursor-pointer"
        >
          Hoạt động
        </button>
      </div>
    </div>

    <!-- Section 1: Duty Shifts -->
    <section
      v-if="['all', 'duty', 'upcoming', 'today'].includes(filterType)"
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">
          Ca trực tuần đã đăng ký ({{ displayedDutyShifts.length }})
        </h3>
      </div>

      <div v-if="displayedDutyShifts.length === 0" class="py-8 text-center text-xs text-slate-400">
        Không có ca trực tuần nào phù hợp bộ lọc.
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div
          v-for="r in displayedDutyShifts"
          :key="r.id"
          class="p-3.5 rounded-lg border flex flex-col justify-between gap-3"
          :class="r.date === today
            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70'
            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'"
        >
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold">
                {{ r.shiftType }}
              </span>
              <span
                class="text-[11px] font-semibold px-2 py-0.5 rounded"
                :class="r.date === today
                  ? 'bg-emerald-700 text-white'
                  : (r.date > today ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'text-slate-400')"
              >
                {{ r.date === today ? 'Hôm nay' : (r.date > today ? 'Sắp diễn ra' : 'Đã qua') }}
              </span>
            </div>
            <div class="text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
              Ngày {{ formatDate(r.date) }}
              <span class="font-normal text-slate-500">({{ getWeekNameFromDate(r.date) }})</span>
            </div>
            <p v-if="r.notes" class="text-xs text-slate-500 italic">{{ r.notes }}</p>
          </div>

          <div class="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs">
            <button
              v-if="r.date === today"
              type="button"
              @click="ui.currentTab = 'entry'"
              class="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
            >
              Điểm danh
            </button>
            <span v-else class="text-[11px] text-slate-400">Lịch trực văn phòng</span>

            <button
              v-if="r.date >= today"
              type="button"
              @click="ui.currentTab = 'leave'"
              class="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Xin nghỉ ca này
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2: Activity Shifts -->
    <section
      v-if="['all', 'activity', 'upcoming', 'today'].includes(filterType)"
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">
          Ca hoạt động đã đăng ký ({{ displayedActivityShifts.length }})
        </h3>
      </div>

      <div v-if="displayedActivityShifts.length === 0" class="py-8 text-center text-xs text-slate-400">
        Không có ca hoạt động nào phù hợp bộ lọc.
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div
          v-for="ar in displayedActivityShifts"
          :key="ar.id"
          class="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
        >
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold">
                {{ ar.shiftType }}
              </span>
              <span class="text-[11px] font-semibold" :class="activityStatus(ar).color">
                {{ activityStatus(ar).label }}
              </span>
            </div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
              {{ getActName(ar.activityId) }}
            </h4>
            <p class="text-xs text-slate-500 tabular-nums">
              Ngày {{ formatDate(ar.date) }} · {{ getActLocation(ar.activityId) }}
            </p>
            <p v-if="ar.notes" class="text-xs text-slate-500 italic">{{ ar.notes }}</p>
          </div>

          <div class="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2 text-xs">
            <button
              v-if="ar.date === today && getCheckIn(ar.activityId)?.status !== 'present'"
              type="button"
              @click="ui.currentTab = 'activities'"
              class="px-3 py-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
            >
              Điểm danh ngay
            </button>
            <span v-else class="text-[11px] text-slate-400">Hỗ trợ hoạt động</span>

            <button
              v-if="ar.date >= today && getCheckIn(ar.activityId)?.status !== 'present'"
              type="button"
              @click="askCancelActivityReg(ar)"
              class="text-xs font-semibold text-[#c8102e] dark:text-red-400 hover:underline cursor-pointer"
            >
              Hủy ca
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search } from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';
import { useAuthStore } from '../../stores/auth.js';
import { useUiStore } from '../../stores/ui.js';
import { getTodayStr, formatDate, getWeekNameFromDate } from '../../utils/date.js';

const data = useDataStore();
const auth = useAuthStore();
const ui = useUiStore();

const today = computed(() => getTodayStr());
const filterType = ref('all');
const searchKeyword = ref('');

const filterOptions = [
  { id: 'all', label: 'Tất cả' },
  { id: 'duty', label: 'Ca trực tuần' },
  { id: 'activity', label: 'Ca hoạt động' }
];

const myDutyShifts = computed(() =>
  data.registrations
    .filter((r) => r.memberId === auth.loggedInMemberId)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
);

const myActivityShifts = computed(() =>
  data.activityRegistrations
    .filter((r) => r.memberId === auth.loggedInMemberId)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
);

const upcomingCount = computed(() =>
  myDutyShifts.value.filter((s) => s.date >= today.value).length +
  myActivityShifts.value.filter((s) => s.date >= today.value).length
);

const todayCount = computed(() =>
  myDutyShifts.value.filter((s) => s.date === today.value).length +
  myActivityShifts.value.filter((s) => s.date === today.value).length
);

function getActName(actId) {
  return data.activities.find((a) => a.id === actId)?.name || 'Hoạt động';
}

function getActLocation(actId) {
  return data.activities.find((a) => a.id === actId)?.location || 'Trường ĐH';
}

function getCheckIn(actId) {
  return data.getUserCheckInRecord(actId, auth.loggedInMemberId);
}

function activityStatus(ar) {
  const chk = getCheckIn(ar.activityId);
  if (chk?.status === 'present') return { label: 'Đã điểm danh', color: 'text-emerald-700 dark:text-emerald-400' };
  if (chk?.status === 'leave') return { label: 'Đã xin nghỉ', color: 'text-amber-700 dark:text-amber-400' };
  if (ar.date === today.value) return { label: 'Hôm nay', color: 'text-brand-700 dark:text-brand-400' };
  if (ar.date > today.value) return { label: 'Chờ diễn ra', color: 'text-slate-500' };
  return { label: 'Quá hạn', color: 'text-[#c8102e] dark:text-red-400' };
}

const displayedDutyShifts = computed(() => {
  let list = myDutyShifts.value;
  if (filterType.value === 'upcoming') list = list.filter((s) => s.date >= today.value);
  if (filterType.value === 'today') list = list.filter((s) => s.date === today.value);
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return list;
  return list.filter(
    (s) => s.shiftType.toLowerCase().includes(kw) || formatDate(s.date).includes(kw) || (s.notes || '').toLowerCase().includes(kw)
  );
});

const displayedActivityShifts = computed(() => {
  let list = myActivityShifts.value;
  if (filterType.value === 'upcoming') list = list.filter((s) => s.date >= today.value);
  if (filterType.value === 'today') list = list.filter((s) => s.date === today.value);
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return list;
  return list.filter(
    (s) =>
      getActName(s.activityId).toLowerCase().includes(kw) ||
      s.shiftType.toLowerCase().includes(kw) ||
      formatDate(s.date).includes(kw)
  );
});

function askCancelActivityReg(ar) {
  ui.openConfirm({
    title: 'Hủy đăng ký ca hoạt động?',
    message: `Hủy ca ${ar.shiftType} ngày ${formatDate(ar.date)} của hoạt động "${getActName(ar.activityId)}"?`,
    confirmText: 'Hủy ca',
    action: () => data.deleteActivityRegistration(ar.id)
  });
}
</script>
