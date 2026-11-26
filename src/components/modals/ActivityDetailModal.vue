<template>
  <Transition name="modal">
    <div
      v-if="show && activity"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div class="min-w-0">
            <span class="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-[11px] font-semibold">
              {{ activity.semester || 'Hoạt động' }}
            </span>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mt-1 leading-snug">
              {{ activity.name }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5 tabular-nums">
              {{ formatDate(activity.date) }} · {{ activity.location || 'Trường ĐH' }}
            </p>
          </div>
          <button type="button" @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <!-- Summary Counts -->
          <div class="grid grid-cols-3 gap-2.5 text-center">
            <div class="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70">
              <div class="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{{ stats.totalCheckIns }}</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Đã điểm danh</div>
            </div>
            <div class="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70">
              <div class="text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">{{ stats.totalLeaves }}</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Xin nghỉ</div>
            </div>
            <div class="p-2.5 rounded-lg bg-brand-50/60 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800/70">
              <div class="text-lg font-bold text-brand-700 dark:text-brand-400 tabular-nums">{{ stats.totalRegistrations }}</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Lượt đăng ký</div>
            </div>
          </div>

          <!-- Admin Check-in On Behalf -->
          <div class="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-slate-800 dark:text-slate-200">Điểm danh hộ / điểm danh bù</span>
              <button
                type="button"
                @click="isFormOpen = !isFormOpen"
                class="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
              >
                {{ isFormOpen ? 'Thu gọn' : 'Mở rộng' }}
              </button>
            </div>

            <div v-show="isFormOpen" class="space-y-2.5">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="onlyRegistered = true"
                  class="px-2.5 py-1 rounded-md font-semibold cursor-pointer"
                  :class="onlyRegistered ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'"
                >
                  Đã đăng ký
                </button>
                <button
                  type="button"
                  @click="onlyRegistered = false"
                  class="px-2.5 py-1 rounded-md font-semibold cursor-pointer"
                  :class="!onlyRegistered ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'"
                >
                  Tất cả thành viên
                </button>
              </div>

              <div v-if="!selectedMember" class="space-y-1.5">
                <input
                  v-model="memberQuery"
                  type="text"
                  placeholder="Tìm theo tên hoặc MSSV..."
                  class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
                />
                <div class="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                  <div v-if="candidates.length === 0" class="p-3 text-center text-slate-400">
                    Không có thành viên phù hợp.
                  </div>
                  <button
                    v-for="m in candidates"
                    :key="m.id"
                    type="button"
                    @click="selectMember(m)"
                    class="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div class="min-w-0">
                      <span class="font-semibold text-slate-900 dark:text-white">{{ m.name }}</span>
                      <span class="font-mono text-slate-500 ml-1.5">{{ m.id }}</span>
                    </div>
                    <span class="text-brand-600 dark:text-brand-400 font-semibold shrink-0">Chọn</span>
                  </button>
                </div>
              </div>

              <div v-else class="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-900 dark:text-white">{{ selectedMember.name }}</span>
                    <span class="font-mono text-slate-500 ml-1.5">{{ selectedMember.id }}</span>
                  </div>
                  <button type="button" @click="selectedMember = null; selectedShift = null" class="text-brand-600 font-semibold hover:underline cursor-pointer">
                    Đổi
                  </button>
                </div>

                <div v-if="memberShifts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <button
                    v-for="s in memberShifts"
                    :key="s.id"
                    type="button"
                    @click="selectedShift = s"
                    class="p-2 rounded-lg border text-left transition cursor-pointer"
                    :class="selectedShift?.id === s.id
                      ? 'bg-brand-50 dark:bg-brand-900/40 border-brand-600 text-brand-900 dark:text-brand-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'"
                  >
                    {{ formatDate(s.date) }} · {{ s.shiftType }}
                  </button>
                </div>

                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    @click="selectedMember = null; selectedShift = null"
                    class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    @click="confirmAdminCheckIn"
                    class="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
                  >
                    Xác nhận điểm danh hộ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Filter Tabs & Search -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div class="inline-flex gap-1">
              <button
                v-for="t in listTabs"
                :key="t.id"
                type="button"
                @click="activeTab = t.id"
                class="px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                :class="activeTab === t.id ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'"
              >
                {{ t.label }}
              </button>
            </div>
            <input
              v-model="listQuery"
              type="text"
              placeholder="Tìm tên, MSSV..."
              class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600 sm:w-52"
            />
          </div>

          <!-- Present List -->
          <div v-if="activeTab === 'all' || activeTab === 'present'" class="space-y-1.5">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Đã điểm danh ({{ filteredPresent.length }})
            </h4>
            <div v-if="filteredPresent.length === 0" class="py-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              Chưa có lượt điểm danh nào.
            </div>
            <div v-else class="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div v-for="item in filteredPresent" :key="item.id" class="p-3 flex items-center justify-between gap-3 text-xs">
                <div class="min-w-0">
                  <div class="font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span>{{ item.memberName || data.getMemberName(item.memberId) }}</span>
                    <span class="font-mono text-slate-500">{{ item.memberId }}</span>
                    <button
                      v-if="item.hasProof || item.proofImage"
                      type="button"
                      @click="openProof(item)"
                      class="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
                    >
                      <Image class="w-3.5 h-3.5" />
                      <span>Xem minh chứng</span>
                    </button>
                  </div>
                  <div class="text-[11px] text-slate-500 tabular-nums mt-0.5">
                    {{ formatDateTime(item.timestamp) }}
                    <span v-if="item.shiftType"> · {{ item.shiftType }}</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] shrink-0">
                  {{ item.adminCheckedIn ? 'Admin điểm danh' : 'Có mặt' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Leave List -->
          <div v-if="activeTab === 'all' || activeTab === 'leave'" class="space-y-1.5">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Xin nghỉ ({{ filteredLeaves.length }})
            </h4>
            <div v-if="filteredLeaves.length === 0" class="py-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              Không có lượt xin nghỉ.
            </div>
            <div v-else class="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div v-for="item in filteredLeaves" :key="item.id" class="p-3 space-y-1 text-xs">
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <span class="font-semibold text-slate-900 dark:text-white">{{ item.memberName || data.getMemberName(item.memberId) }}</span>
                    <span class="font-mono text-slate-500 ml-1.5">{{ item.memberId }}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                    Vắng có lý do
                  </span>
                </div>
                <p v-if="item.leaveReason" class="text-slate-600 dark:text-slate-400">Lý do: {{ item.leaveReason }}</p>
              </div>
            </div>
          </div>

          <!-- Registrations List -->
          <div v-if="activeTab === 'all' || activeTab === 'regs'" class="space-y-1.5">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Đã đăng ký ca ({{ filteredRegs.length }})
            </h4>
            <div v-if="filteredRegs.length === 0" class="py-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              Chưa có lượt đăng ký ca.
            </div>
            <div v-else class="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div v-for="item in filteredRegs" :key="item.id" class="p-3 flex items-center justify-between gap-2 text-xs">
                <div>
                  <div class="font-semibold text-slate-900 dark:text-white">
                    {{ item.memberName || data.getMemberName(item.memberId) }}
                    <span class="font-mono text-slate-500 font-normal ml-1">{{ item.memberId }}</span>
                  </div>
                  <div class="text-[11px] text-slate-500 tabular-nums mt-0.5">
                    {{ formatDate(item.date) }} · {{ item.shiftType }}
                    <span v-if="item.notes"> · {{ item.notes }}</span>
                  </div>
                </div>
                <button
                  v-if="!isRegCheckedIn(item)"
                  type="button"
                  @click="quickCheckIn(item)"
                  class="px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[11px] cursor-pointer shrink-0"
                >
                  Điểm danh hộ
                </button>
                <span v-else class="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  Có mặt
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 text-xs">
          <button
            type="button"
            @click="exportExcel"
            class="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet class="w-3.5 h-3.5" />
            <span>Xuất Excel (DSSV)</span>
          </button>
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      <!-- Lazy Proof Photo Lightbox -->
      <div
        v-if="proofModal.show"
        class="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-4"
        @click.self="proofModal.show = false"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">Ảnh minh chứng thẻ sinh viên</h4>
              <p class="text-xs text-slate-500">
                {{ proofModal.item?.memberName }} ({{ proofModal.item?.memberId }})
              </p>
            </div>
            <button type="button" @click="proofModal.show = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="rounded-lg bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[200px] flex items-center justify-center p-2">
            <Loader2 v-if="proofModal.loading" class="w-6 h-6 text-white animate-spin" />
            <img v-else-if="proofModal.imageUrl" :src="proofModal.imageUrl" alt="Ảnh minh chứng" class="max-h-[60vh] object-contain rounded" />
            <p v-else class="text-xs text-slate-400">Không tìm thấy dữ liệu ảnh trên máy chủ.</p>
          </div>

          <div class="flex items-center justify-end gap-2 text-xs">
            <a
              :href="GOOGLE_DRIVE_FOLDER_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Mở Google Drive
            </a>
            <button
              v-if="proofModal.imageUrl"
              type="button"
              @click="downloadProof"
              class="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
            >
              Tải ảnh về
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X, Image, FileSpreadsheet, Loader2 } from 'lucide-vue-next';
import { useDataStore, GOOGLE_DRIVE_FOLDER_URL } from '../../stores/data.js';
import { useUiStore } from '../../stores/ui.js';
import { formatDate, formatDateTime } from '../../utils/date.js';
import { downloadBase64File } from '../../utils/fileExport.js';
import { exportActivityCheckInExcel } from '../../utils/exporters.js';

const props = defineProps({
  show: Boolean,
  activity: { type: Object, default: null }
});
defineEmits(['close']);

const data = useDataStore();
const ui = useUiStore();

const activeTab = ref('all');
const isFormOpen = ref(false);
const onlyRegistered = ref(true);
const memberQuery = ref('');
const selectedMember = ref(null);
const selectedShift = ref(null);
const listQuery = ref('');

const proofModal = ref({ show: false, loading: false, item: null, imageUrl: '' });

const stats = computed(() =>
  props.activity ? data.getActivityStats(props.activity.id) : { totalCheckIns: 0, totalLeaves: 0, totalRegistrations: 0, presentList: [], leaveList: [], regsList: [], allRecords: [] }
);

const listTabs = computed(() => [
  { id: 'all', label: 'Tất cả' },
  { id: 'present', label: `Có mặt (${stats.value.presentList.length})` },
  { id: 'leave', label: `Xin nghỉ (${stats.value.leaveList.length})` },
  { id: 'regs', label: `Đăng ký (${stats.value.regsList.length})` }
]);

const candidates = computed(() => {
  let pool = data.members;
  if (onlyRegistered.value) {
    const regIds = new Set(stats.value.regsList.map((r) => r.memberId));
    pool = pool.filter((m) => regIds.has(m.id));
  }
  const q = memberQuery.value.trim().toLowerCase();
  if (!q) return pool.slice(0, 15);
  return pool.filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)).slice(0, 20);
});

const memberShifts = computed(() => {
  if (!selectedMember.value) return [];
  return stats.value.regsList.filter((r) => r.memberId === selectedMember.value.id);
});

function selectMember(m) {
  selectedMember.value = m;
  selectedShift.value = memberShifts.value[0] || null;
}

async function confirmAdminCheckIn() {
  if (!selectedMember.value || !props.activity) return;
  await data.checkInActivity({
    activityId: props.activity.id,
    targetMemberId: selectedMember.value.id,
    shiftInfo: selectedShift.value ? { shiftType: selectedShift.value.shiftType, date: selectedShift.value.date } : null
  });
  selectedMember.value = null;
  selectedShift.value = null;
  memberQuery.value = '';
}

async function quickCheckIn(item) {
  if (!props.activity) return;
  await data.checkInActivity({
    activityId: props.activity.id,
    targetMemberId: item.memberId,
    shiftInfo: { shiftType: item.shiftType, date: item.date }
  });
}

function isRegCheckedIn(reg) {
  return stats.value.presentList.some(
    (p) => p.memberId === reg.memberId && (!p.shiftType || p.shiftType === reg.shiftType)
  );
}

const matchQuery = (item) => {
  const q = listQuery.value.trim().toLowerCase();
  if (!q) return true;
  return (
    (item.memberName || data.getMemberName(item.memberId)).toLowerCase().includes(q) ||
    item.memberId.toLowerCase().includes(q) ||
    (item.shiftType || '').toLowerCase().includes(q) ||
    (item.leaveReason || '').toLowerCase().includes(q)
  );
};

const filteredPresent = computed(() => stats.value.presentList.filter(matchQuery));
const filteredLeaves = computed(() => stats.value.leaveList.filter(matchQuery));
const filteredRegs = computed(() => stats.value.regsList.filter(matchQuery));

async function openProof(item) {
  proofModal.value = { show: true, loading: true, item, imageUrl: '' };
  const img = await data.fetchProofImage(item);
  proofModal.value.imageUrl = img;
  proofModal.value.loading = false;
}

async function downloadProof() {
  if (!proofModal.value.imageUrl) return;
  const item = proofModal.value.item;
  const datePart = (props.activity?.date || '').split('-').reverse().join('_');
  const fileName = item?.proofFileName || `${item?.memberName || 'ThanhVien'} - ${item?.memberId || 'MSSV'} - ${datePart}.jpg`;
  await downloadBase64File(proofModal.value.imageUrl, fileName, ui.showToast);
}

async function exportExcel() {
  if (!props.activity) return;
  await exportActivityCheckInExcel({
    activity: props.activity,
    derived: data.computeActivityDerivedFields(props.activity),
    checkIns: stats.value.allRecords,
    registrations: stats.value.regsList,
    getMemberName: data.getMemberName,
    getMemberDept: data.getMemberDept,
    notify: ui.showToast
  });
}

watch(() => props.show, (open) => {
  if (!open) {
    selectedMember.value = null;
    selectedShift.value = null;
    memberQuery.value = '';
    listQuery.value = '';
    proofModal.value.show = false;
  }
});
</script>
