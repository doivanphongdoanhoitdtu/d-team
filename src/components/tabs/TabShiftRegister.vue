<template>
  <div class="space-y-5">
    <!-- Admin Portal Toggle Banner -->
    <div
      v-if="auth.isAdmin"
      class="bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      :class="isRegOpen ? 'border-emerald-200 dark:border-emerald-800/70' : 'border-red-200 dark:border-red-800/70'"
    >
      <div class="flex items-start gap-3">
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          :class="isRegOpen ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/50 text-[#c8102e] dark:text-red-400'"
        >
          <DoorOpen v-if="isRegOpen" class="w-5 h-5" />
          <Lock v-else class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>Cổng đăng ký ca trực</span>
            <span
              class="px-2 py-0.5 rounded text-[11px] font-semibold"
              :class="isRegOpen ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-50 text-[#c8102e] dark:bg-red-950 dark:text-red-300'"
            >
              {{ isRegOpen ? 'Đang mở' : 'Đang đóng' }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ isRegOpen ? 'Thành viên có thể đăng ký ca trực bình thường.' : 'Đã khóa đăng ký với thành viên. Quản trị viên vẫn có thể bổ sung trực tiếp.' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="data.toggleRegistrationOpen()"
          class="px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
          :class="isRegOpen ? 'bg-[#c8102e] hover:bg-red-700' : 'bg-emerald-700 hover:bg-emerald-800'"
        >
          {{ isRegOpen ? 'Đóng cổng đăng ký' : 'Mở cổng đăng ký' }}
        </button>
        <button
          type="button"
          @click="ui.showShiftSettingsModal = true"
          class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <SlidersHorizontal class="w-3.5 h-3.5" />
          <span>Cấu hình ca</span>
        </button>
      </div>
    </div>

    <!-- Member Closed Banner -->
    <div
      v-if="!auth.isAdmin && !isRegOpen"
      class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/70 rounded-xl p-4 flex items-start gap-3 text-xs"
    >
      <Lock class="w-4 h-4 text-[#c8102e] dark:text-red-400 shrink-0 mt-0.5" />
      <div>
        <p class="font-bold text-[#c8102e] dark:text-red-300">Cổng đăng ký ca trực hiện đang tạm đóng</p>
        <p class="text-slate-600 dark:text-slate-300 mt-0.5">
          Quản trị viên đang chốt lịch trực. Nếu cần bổ sung hoặc đổi ca, vui lòng liên hệ Ban Điều hành.
        </p>
      </div>
    </div>

    <!-- 2-Column Workspace -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Registration Form -->
      <section class="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 h-fit space-y-4">
        <div class="pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Đăng ký lịch trực</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Đăng ký ca trực dự kiến theo ngày</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Thành viên đăng ký <span class="text-[#c8102e]">*</span>
            </label>
            <div v-if="auth.isAdmin" class="space-y-1.5">
              <div class="relative">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  v-model="adminMemberSearch"
                  type="text"
                  placeholder="Lọc thành viên theo tên, MSSV..."
                  class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
                />
              </div>
              <select
                v-model="form.memberId"
                required
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              >
                <option value="" disabled>-- Chọn thành viên ({{ filteredMembers.length }}) --</option>
                <option v-for="m in filteredMembers" :key="m.id" :value="m.id">
                  [{{ m.id }}] {{ m.name }} ({{ m.department || 'Chưa phân ban' }})
                </option>
              </select>
            </div>
            <div
              v-else
              class="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
            >
              <div class="font-semibold text-slate-900 dark:text-white">{{ data.getMemberName(auth.loggedInMemberId) }}</div>
              <div class="text-[11px] text-slate-500 font-mono mt-0.5">
                {{ auth.loggedInMemberId }} · {{ data.getMemberDept(auth.loggedInMemberId) }}
              </div>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày trực <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model="form.date"
              type="date"
              :min="auth.isAdmin ? undefined : today"
              :disabled="!auth.isAdmin && !isRegOpen"
              required
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-600 disabled:opacity-50"
            />
            <div v-if="form.date" class="flex items-center justify-between text-[11px] mt-1">
              <span class="text-slate-500 dark:text-slate-400">{{ getWeekNameFromDate(form.date) }}</span>
              <span class="font-semibold" :class="dateIsFull ? 'text-[#c8102e]' : 'text-emerald-700 dark:text-emerald-400'">
                {{ dateIsFull ? 'Đã kín tất cả ca' : (data.shiftSettings.maxPerShift > 0 ? `Kín ${data.getTakenShiftsCountForDate(form.date)}/${data.shiftTypes.length} ca` : 'Không giới hạn') }}
              </span>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ca trực <span class="text-[#c8102e]">*</span>
            </label>
            <select
              v-model="form.shiftType"
              :disabled="isFormDisabled"
              required
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-600 disabled:opacity-50"
            >
              <option
                v-for="st in data.shiftTypes"
                :key="st.id || st.name"
                :value="st.name || st.id"
                :disabled="data.isShiftFullOnDate(st.name || st.id, form.date)"
              >
                {{ st.name }} {{ st.time ? `(${st.time})` : '' }} — {{ slotLabel(st.name || st.id) }}
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ghi chú</label>
            <input
              v-model="form.notes"
              type="text"
              :disabled="!auth.isAdmin && !isRegOpen"
              placeholder="VD: Trực cố định sáng thứ 3..."
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600 disabled:opacity-50"
            />
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Định mức:
              {{ data.shiftSettings.maxPerShift > 0 ? `Tối đa ${data.shiftSettings.maxPerShift} người/ca` : 'Không giới hạn người/ca' }}
              ·
              {{ data.shiftSettings.maxPerDay > 0 ? `Tối đa ${data.shiftSettings.maxPerDay} ca/ngày` : 'Không giới hạn ca/ngày' }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="isFormDisabled"
            class="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CalendarPlus class="w-4 h-4" />
            <span>{{ !auth.isAdmin && !isRegOpen ? 'Cổng đăng ký đang đóng' : 'Đăng ký ca trực' }}</span>
          </button>
        </form>
      </section>

      <!-- Registrations List -->
      <section class="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Danh sách ca đã đăng ký</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hiển thị lịch trực dự kiến theo bộ lọc tháng / tuần</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <div class="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                @click="filterMode = 'all'"
                class="px-2.5 py-1 rounded-md cursor-pointer"
                :class="filterMode === 'all' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
              >
                Tất cả ({{ periodRegs.length }})
              </button>
              <button
                type="button"
                @click="filterMode = 'mine'"
                class="px-2.5 py-1 rounded-md cursor-pointer"
                :class="filterMode === 'mine' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
              >
                Của tôi ({{ myCount }})
              </button>
            </div>

            <button
              type="button"
              @click="handleExportMatrix"
              class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet class="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Tìm theo tên, MSSV, Ban hoặc ca trực..."
            class="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
          />
          <button
            v-if="searchKeyword"
            type="button"
            @click="searchKeyword = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Items -->
        <div class="space-y-2 max-h-[540px] overflow-y-auto pr-1">
          <div
            v-for="r in displayedRegs"
            :key="r.id"
            class="p-3 rounded-lg border flex items-center justify-between gap-3 transition"
            :class="r.memberId === auth.loggedInMemberId
              ? 'bg-brand-50/50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800/70'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'"
          >
            <div class="min-w-0 space-y-0.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  {{ data.getMemberName(r.memberId) }}
                </span>
                <span class="text-[11px] font-mono text-slate-500">{{ r.memberId }}</span>
                <span class="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/50 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-[11px] font-semibold">
                  {{ r.shiftType }}
                </span>
                <span class="text-[11px] text-slate-500 hidden sm:inline">· {{ data.getMemberDept(r.memberId) }}</span>
              </div>
              <div class="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                Ngày {{ formatDate(r.date) }}
                <span class="text-slate-400">({{ getWeekNameFromDate(r.date) }})</span>
                <span v-if="r.notes" class="italic text-slate-500 ml-1.5">— {{ r.notes }}</span>
              </div>
            </div>

            <div class="shrink-0">
              <button
                v-if="auth.isAdmin"
                type="button"
                @click="askDelete(r)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-[#c8102e] hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                title="Xóa lịch đăng ký"
              >
                <Trash2 class="w-4 h-4" />
              </button>
              <span
                v-else-if="r.memberId === auth.loggedInMemberId"
                class="text-[11px] text-slate-400 hidden sm:inline"
              >
                Nộp đơn nghỉ để hủy
              </span>
            </div>
          </div>

          <div v-if="displayedRegs.length === 0" class="py-10 text-center text-xs text-slate-400">
            {{ filterMode === 'mine' ? 'Bạn chưa có lịch đăng ký trong khoảng thời gian này.' : 'Chưa có lịch đăng ký ca trực phù hợp.' }}
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { DoorOpen, Lock, SlidersHorizontal, Search, CalendarPlus, FileSpreadsheet, X, Trash2 } from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';
import { useAuthStore } from '../../stores/auth.js';
import { useUiStore } from '../../stores/ui.js';
import { getTodayStr, formatDate, getWeekNameFromDate } from '../../utils/date.js';
import { exportShiftScheduleMatrixExcel } from '../../utils/exporters.js';
import { scheduleShiftReminder } from '../../utils/notifications.js';

const data = useDataStore();
const auth = useAuthStore();
const ui = useUiStore();

const today = computed(() => getTodayStr());
const isRegOpen = computed(() => data.shiftSettings?.isRegistrationOpen !== false);

const adminMemberSearch = ref('');
const filterMode = ref('all');
const searchKeyword = ref('');

const form = ref({
  memberId: auth.loggedInMemberId,
  date: getTodayStr(),
  shiftType: data.shiftTypes[0]?.name || 'Ca 1',
  notes: ''
});

const filteredMembers = computed(() => {
  const q = adminMemberSearch.value.trim().toLowerCase();
  if (!q) return data.members;
  return data.members.filter(
    (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.department || '').toLowerCase().includes(q)
  );
});

const dateIsFull = computed(() => data.isDateFull(form.value.date));
const isFormDisabled = computed(() => {
  if (!auth.isAdmin && !isRegOpen.value) return true;
  if (dateIsFull.value) return true;
  if (!auth.isAdmin && form.value.date && form.value.date < today.value) return true;
  return false;
});

function slotLabel(shiftName) {
  const count = data.getShiftRegisteredCount(shiftName, form.value.date);
  const max = Number(data.shiftSettings?.maxPerShift) || 0;
  if (max <= 0) return `${count} đã đăng ký`;
  return count >= max ? `${count}/${max} (Đầy)` : `${count}/${max} chỗ`;
}

async function handleSubmit() {
  const saved = await data.saveRegistration({ ...form.value });
  if (saved) {
    scheduleShiftReminder(saved, data.getMemberName(saved.memberId));
    form.value.notes = '';
  }
}

const periodRegs = computed(() => data.getRegistrationsForPeriod(ui.selectedMonth, ui.selectedWeek));

const myCount = computed(() =>
  periodRegs.value.filter((r) => r.memberId === auth.loggedInMemberId).length
);

const displayedRegs = computed(() => {
  let list = periodRegs.value;
  if (filterMode.value === 'mine') {
    list = list.filter((r) => r.memberId === auth.loggedInMemberId);
  }
  const q = searchKeyword.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter((r) =>
    data.getMemberName(r.memberId).toLowerCase().includes(q) ||
    r.memberId.toLowerCase().includes(q) ||
    data.getMemberDept(r.memberId).toLowerCase().includes(q) ||
    r.shiftType.toLowerCase().includes(q) ||
    (r.notes || '').toLowerCase().includes(q)
  );
});

function askDelete(reg) {
  ui.openConfirm({
    title: 'Hủy lịch đăng ký ca trực?',
    message: `Xóa lịch ${reg.shiftType} ngày ${formatDate(reg.date)} của ${data.getMemberName(reg.memberId)} (${reg.memberId})?`,
    confirmText: 'Xóa lịch trực',
    action: () => data.deleteRegistration(reg.id)
  });
}

async function handleExportMatrix() {
  await exportShiftScheduleMatrixExcel({
    registrations: periodRegs.value,
    monthStr: ui.selectedMonth,
    selectedWeek: ui.selectedWeek,
    shiftTypeNames: data.shiftTypeNames,
    getMemberName: data.getMemberName,
    notify: ui.showToast
  });
}
</script>
