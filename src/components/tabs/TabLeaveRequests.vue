<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
    <!-- Left: Submit Leave Form -->
    <section class="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 h-fit space-y-4">
      <div class="pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Nộp đơn xin nghỉ phép</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Chỉ áp dụng cho các ca trực hoặc hoạt động đã đăng ký từ hôm nay trở đi.
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Thành viên <span class="text-[#c8102e]">*</span>
          </label>
          <div v-if="auth.isAdmin" class="space-y-1.5">
            <input
              v-model="adminSearch"
              type="text"
              placeholder="Lọc thành viên theo tên, MSSV..."
              class="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
            <select
              v-model="form.memberId"
              required
              @change="onMemberChange"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            >
              <option value="" disabled>-- Chọn thành viên --</option>
              <option v-for="m in filteredMembers" :key="m.id" :value="m.id">
                [{{ m.id }}] {{ m.name }} ({{ m.department || 'Chưa phân ban' }})
              </option>
            </select>
          </div>
          <div v-else class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-900 dark:text-white">
            <span class="font-mono text-brand-700 dark:text-brand-400 mr-1.5">{{ form.memberId }}</span>
            {{ data.getMemberName(form.memberId) }}
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Ban hoạt động</label>
          <input
            :value="data.getMemberDept(form.memberId)"
            type="text"
            readonly
            class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400"
          />
        </div>

        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Ca trực / hoạt động xin nghỉ <span class="text-[#c8102e]">*</span>
          </label>
          <select
            v-model="form.selectedRegId"
            required
            class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
          >
            <option value="" disabled>
              {{ availableShifts.length ? '-- Chọn ca đã đăng ký --' : '-- Không có ca đăng ký sắp tới --' }}
            </option>
            <option v-for="r in availableShifts" :key="r.id" :value="r.id">
              {{ formatDate(r.date) }} · {{ r.shiftType }}
            </option>
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Lý do xin nghỉ <span class="text-[#c8102e]">*</span>
          </label>
          <textarea
            v-model="form.reason"
            rows="3"
            required
            placeholder="Nêu rõ lý do xin nghỉ phép (lịch thi, việc cá nhân...)"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="availableShifts.length === 0"
          class="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gửi đơn xin nghỉ
        </button>
      </form>
    </section>

    <!-- Right: Leave Queue -->
    <section class="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            {{ auth.isAdmin ? 'Danh sách xét duyệt đơn xin nghỉ phép' : 'Đơn xin nghỉ phép của tôi' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Khi đơn được duyệt, lịch đăng ký tương ứng sẽ tự động được gỡ bỏ.
          </p>
        </div>
        <span
          v-if="auth.isAdmin && pendingCount > 0"
          class="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold tabular-nums"
        >
          {{ pendingCount }} đơn chờ duyệt
        </span>
      </div>

      <!-- Status Filter + Search -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div class="inline-flex flex-wrap gap-1">
          <button
            v-for="st in statusOptions"
            :key="st.id"
            type="button"
            @click="statusFilter = st.id"
            class="px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer border"
            :class="statusFilter === st.id
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'"
          >
            {{ st.label }}
          </button>
        </div>

        <div class="relative sm:w-60">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Tìm theo tên, MSSV, lý do..."
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
          />
        </div>
      </div>

      <!-- List -->
      <div class="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
        <div
          v-for="l in displayedLeaves"
          :key="l.id"
          class="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {{ l.memberName || data.getMemberName(l.memberId) }}
                </span>
                <span class="text-[11px] font-mono text-slate-500">{{ l.memberId }}</span>
                <span
                  v-if="l.isActivity"
                  class="px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-[10px] font-semibold"
                >
                  Hoạt động
                </span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {{ l.department || data.getMemberDept(l.memberId) }} ·
                <strong class="text-slate-800 dark:text-slate-200">{{ l.shiftType }}</strong>
                <span class="tabular-nums"> ({{ formatDate(l.shiftDate || l.date) }})</span>
              </p>
            </div>

            <span
              class="px-2 py-0.5 rounded border text-[11px] font-semibold shrink-0"
              :class="statusBadgeClass(l.status)"
            >
              {{ l.status }}
            </span>
          </div>

          <p class="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-2 rounded-md border border-slate-200/80 dark:border-slate-800">
            <span class="font-semibold text-slate-500 dark:text-slate-400">Lý do:</span> {{ l.reason }}
          </p>

          <div class="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
            <span class="tabular-nums">Nộp lúc: {{ formatDateTime(l.createdAt) }}</span>
            <div v-if="auth.isAdmin && l.status === 'Chờ duyệt'" class="flex items-center gap-1.5">
              <button
                type="button"
                @click="data.updateLeaveStatus(l, 'Đã duyệt')"
                class="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs cursor-pointer"
              >
                Duyệt đơn
              </button>
              <button
                type="button"
                @click="data.updateLeaveStatus(l, 'Từ chối')"
                class="px-3 py-1 rounded-md border border-red-300 dark:border-red-800 text-[#c8102e] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-xs cursor-pointer"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>

        <div v-if="displayedLeaves.length === 0" class="py-10 text-center text-xs text-slate-400">
          Không có đơn xin nghỉ phép nào phù hợp.
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
import { getTodayStr, formatDate, formatDateTime } from '../../utils/date.js';

const data = useDataStore();
const auth = useAuthStore();

const today = computed(() => getTodayStr());
const adminSearch = ref('');
const statusFilter = ref('all');
const searchKeyword = ref('');

const statusOptions = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Chờ duyệt', label: 'Chờ duyệt' },
  { id: 'Đã duyệt', label: 'Đã duyệt' },
  { id: 'Từ chối', label: 'Từ chối' }
];

const form = ref({
  memberId: auth.loggedInMemberId,
  selectedRegId: '',
  reason: ''
});

const filteredMembers = computed(() => {
  const q = adminSearch.value.trim().toLowerCase();
  if (!q) return data.members;
  return data.members.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
});

const availableShifts = computed(() => {
  const mId = String(form.value.memberId || '').trim().toUpperCase();
  if (!mId) return [];

  const regular = data.registrations
    .filter((r) => r.memberId === mId && r.date >= today.value)
    .map((r) => ({
      id: r.id,
      date: r.date,
      shiftType: r.shiftType,
      isActivity: false
    }));

  const actShifts = data.activityRegistrations
    .filter((r) => r.memberId === mId && r.date >= today.value)
    .map((r) => {
      const actName = data.activities.find((a) => a.id === r.activityId)?.name || 'Hoạt động';
      return {
        id: r.id,
        activityId: r.activityId,
        activityName: actName,
        date: r.date,
        shiftType: `Hoạt động: ${actName} (${r.shiftType})`,
        isActivity: true
      };
    });

  return [...regular, ...actShifts].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
});

function onMemberChange() {
  form.value.selectedRegId = '';
}

async function handleSubmit() {
  const found = availableShifts.value.find((s) => s.id === form.value.selectedRegId);
  if (!found) return;
  const ok = await data.saveLeaveRequest({
    memberId: form.value.memberId,
    selectedRegId: found.id,
    activityId: found.activityId || null,
    activityName: found.activityName || '',
    isActivity: found.isActivity,
    department: data.getMemberDept(form.value.memberId),
    shiftDate: found.date,
    shiftType: found.shiftType,
    reason: form.value.reason
  });
  if (ok) {
    form.value.selectedRegId = '';
    form.value.reason = '';
  }
}

const pendingCount = computed(() => data.leaveRequests.filter((l) => l.status === 'Chờ duyệt').length);

const displayedLeaves = computed(() => {
  let list = data.leaveRequests;
  if (!auth.isAdmin) {
    list = list.filter((l) => l.memberId === auth.loggedInMemberId);
  }
  if (statusFilter.value !== 'all') {
    list = list.filter((l) => l.status === statusFilter.value);
  }
  const q = searchKeyword.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (l) =>
      (l.memberName || data.getMemberName(l.memberId)).toLowerCase().includes(q) ||
      l.memberId.toLowerCase().includes(q) ||
      (l.reason || '').toLowerCase().includes(q) ||
      (l.shiftType || '').toLowerCase().includes(q)
  );
});

function statusBadgeClass(status) {
  if (status === 'Đã duyệt') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  if (status === 'Từ chối') return 'bg-red-50 text-[#c8102e] border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
  return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
}
</script>
