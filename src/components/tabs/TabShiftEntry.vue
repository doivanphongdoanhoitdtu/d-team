<template>
  <div class="space-y-5">
    <!-- Check-in Form Card -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6">
      <div class="pb-4 mb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white">
            Điểm danh ca trực (Sổ gốc)
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ghi nhận thông tin trang sổ và STT sau khi hoàn thành ca trực tại văn phòng.
          </p>
        </div>
        <span class="hidden sm:inline-flex px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold">
          Hôm nay: {{ formatDate(today) }}
        </span>
      </div>

      <!-- Member with no shift registered today -->
      <div
        v-if="!auth.isAdmin && todayMyRegs.length === 0"
        class="py-8 px-4 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3"
      >
        <CalendarX2 class="w-8 h-8 text-slate-400 mx-auto" />
        <div class="max-w-md mx-auto space-y-1">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            Hôm nay ({{ formatDate(today) }}) bạn chưa có lịch trực
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Theo quy định, thành viên chỉ thực hiện điểm danh đúng vào ngày có ca trực đã đăng ký trước.
          </p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
          <button
            type="button"
            @click="ui.currentTab = 'my-shifts'"
            class="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Xem lịch của tôi
          </button>
          <button
            type="button"
            @click="ui.currentTab = 'register'"
            class="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer"
          >
            Đăng ký ca trực
          </button>
        </div>
      </div>

      <!-- Entry Form -->
      <form v-else @submit.prevent="handleSubmit" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Member -->
          <div class="sm:col-span-2">
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Thành viên trực <span class="text-[#c8102e]">*</span>
            </label>
            <div v-if="auth.isAdmin" class="space-y-2">
              <div class="relative">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="memberSearch"
                  type="text"
                  placeholder="Lọc nhanh theo MSSV, Họ tên hoặc Ban..."
                  class="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
                />
              </div>
              <select
                v-model="form.memberId"
                required
                class="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              >
                <option value="" disabled>-- Chọn thành viên ({{ filteredMembers.length }}) --</option>
                <option v-for="m in filteredMembers" :key="m.id" :value="m.id">
                  [{{ m.id }}] {{ m.name }} — {{ m.department || 'Chưa phân ban' }}
                </option>
              </select>
            </div>
            <div
              v-else
              class="px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between"
            >
              <span class="font-semibold text-slate-900 dark:text-white">
                <span class="font-mono text-brand-700 dark:text-brand-400 mr-1.5">{{ auth.loggedInMemberId }}</span>
                {{ data.getMemberName(auth.loggedInMemberId) }}
              </span>
              <span class="text-[11px] font-medium text-slate-500">Thành viên</span>
            </div>
          </div>

          <!-- Date -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ngày trực <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-if="auth.isAdmin"
              v-model="form.date"
              type="date"
              required
              class="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-600"
            />
            <div
              v-else
              class="px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between"
            >
              <span class="tabular-nums">{{ formatDate(today) }} (Hôm nay)</span>
              <CheckCircle2 class="w-4 h-4" />
            </div>
          </div>

          <!-- Shift Type -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ca trực <span class="text-[#c8102e]">*</span>
            </label>
            <select
              v-model="form.shiftType"
              required
              class="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-brand-600"
            >
              <option v-for="st in availableShiftOptions" :key="st.id || st.name" :value="st.name || st.id">
                {{ st.name }} {{ st.time ? `(${st.time})` : '' }}
              </option>
            </select>
            <p v-if="!auth.isAdmin && isAlreadyCheckedIn" class="text-[11px] text-[#c8102e] dark:text-red-400 font-medium mt-1">
              Bạn đã điểm danh ca này hôm nay.
            </p>
          </div>

          <!-- Page & STT -->
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trang số (sổ giấy) <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model.number="form.pageNo"
              type="number"
              min="1"
              required
              placeholder="VD: 12"
              class="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              STT trong trang <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model.number="form.sttNo"
              type="number"
              min="1"
              required
              placeholder="VD: 5"
              class="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-brand-600"
            />
          </div>

          <!-- Status -->
          <div class="sm:col-span-2">
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng thái ca trực
            </label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            >
              <option value="Đúng giờ">Đúng giờ</option>
              <option value="Đi trễ">Đi trễ</option>
              <option value="Về sớm">Về sớm</option>
              <option value="Trực thay">Trực thay</option>
            </select>
          </div>

          <!-- Notes -->
          <div class="sm:col-span-2">
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú / bàn giao ca
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              placeholder="Ghi nhận bàn giao hồ sơ hoặc thông tin cần lưu ý..."
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="resetForm"
            class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Làm mới
          </button>
          <button
            type="submit"
            :disabled="!auth.isAdmin && isAlreadyCheckedIn"
            class="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save class="w-4 h-4" />
            <span>Lưu điểm danh</span>
          </button>
        </div>
      </form>
    </section>

    <!-- Recent Shifts -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Ca trực mới ghi nhận</h3>
        <div class="flex items-center gap-2">
          <div class="relative flex-1 sm:w-56">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="recentSearch"
              type="text"
              placeholder="Lọc tên, MSSV, ca..."
              class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
          </div>
          <button
            v-if="auth.isAdmin"
            type="button"
            @click="ui.currentTab = 'history'"
            class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline shrink-0 cursor-pointer"
          >
            Xem nhật ký
          </button>
        </div>
      </div>

      <div v-if="recentShifts.length === 0" class="py-6 text-center text-xs text-slate-400">
        Chưa có ca trực nào trong kỳ báo cáo này.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="s in recentShifts"
          :key="s.id"
          class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-slate-900 dark:text-white truncate">{{ data.getMemberName(s.memberId) }}</span>
            <span
              class="px-2 py-0.5 rounded text-[11px] font-semibold shrink-0"
              :class="s.status === 'Đúng giờ'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'"
            >
              {{ s.status }}
            </span>
          </div>
          <div class="text-slate-500 dark:text-slate-400 tabular-nums">
            {{ formatDate(s.date) }} · {{ s.shiftType }}
          </div>
          <div class="text-[11px] font-medium text-brand-700 dark:text-brand-400 tabular-nums">
            Sổ gốc: Trang {{ s.pageNo }} — STT {{ s.sttNo }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { CalendarX2, Search, CheckCircle2, Save } from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';
import { useAuthStore } from '../../stores/auth.js';
import { useUiStore } from '../../stores/ui.js';
import { getTodayStr, formatDate } from '../../utils/date.js';

const data = useDataStore();
const auth = useAuthStore();
const ui = useUiStore();

const today = computed(() => getTodayStr());
const memberSearch = ref('');
const recentSearch = ref('');

const form = ref({
  memberId: auth.loggedInMemberId,
  date: getTodayStr(),
  shiftType: data.shiftTypes[0]?.name || 'Ca 1',
  pageNo: '',
  sttNo: '',
  status: 'Đúng giờ',
  notes: ''
});

const filteredMembers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase();
  if (!q) return data.members;
  return data.members.filter(
    (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.department || '').toLowerCase().includes(q)
  );
});

const todayMyRegs = computed(() => {
  if (auth.isAdmin) return [];
  return data.registrations.filter((r) => r.memberId === auth.loggedInMemberId && r.date === today.value);
});

const availableShiftOptions = computed(() => {
  if (auth.isAdmin) return data.shiftTypes;
  const regTypes = new Set(todayMyRegs.value.map((r) => r.shiftType));
  return data.shiftTypes.filter((st) => regTypes.has(st.name || st.id));
});

const isAlreadyCheckedIn = computed(() => {
  if (!form.value.shiftType) return false;
  const mId = auth.isAdmin ? form.value.memberId : auth.loggedInMemberId;
  const d = auth.isAdmin ? form.value.date : today.value;
  return data.shifts.some((s) => s.memberId === mId && s.date === d && s.shiftType === form.value.shiftType);
});

watch(
  () => [auth.isAdmin, auth.loggedInMemberId, todayMyRegs.value],
  () => {
    if (!auth.isAdmin) {
      form.value.memberId = auth.loggedInMemberId;
      form.value.date = today.value;
      const first = todayMyRegs.value[0]?.shiftType;
      if (first && !todayMyRegs.value.some((r) => r.shiftType === form.value.shiftType)) {
        form.value.shiftType = first;
      }
    }
  },
  { immediate: true }
);

function resetForm() {
  form.value = {
    memberId: auth.isAdmin ? form.value.memberId : auth.loggedInMemberId,
    date: getTodayStr(),
    shiftType: availableShiftOptions.value[0]?.name || 'Ca 1',
    pageNo: '',
    sttNo: '',
    status: 'Đúng giờ',
    notes: ''
  };
}

async function handleSubmit() {
  const ok = await data.saveShift({ ...form.value });
  if (ok) resetForm();
}

const recentShifts = computed(() => {
  const list = data.getShiftsForPeriod(ui.selectedMonth, ui.selectedWeek, auth.currentUserRole, auth.loggedInMemberId);
  const q = recentSearch.value.trim().toLowerCase();
  const filtered = q
    ? list.filter((s) =>
        data.getMemberName(s.memberId).toLowerCase().includes(q) ||
        s.memberId.toLowerCase().includes(q) ||
        s.shiftType.toLowerCase().includes(q)
      )
    : list;
  return filtered.slice(0, 6);
});
</script>
