<template>
  <div class="space-y-5">
    <!-- Personal Summary Strip -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Cổng hoạt động cá nhân
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi hoạt động tháng {{ selectedMonthLabel }}, đăng ký ca tham gia, điểm danh minh chứng hoặc gửi đơn xin nghỉ.
          </p>
        </div>

        <div class="flex items-center gap-2 text-xs">
          <label for="portal-month" class="font-semibold text-slate-600 dark:text-slate-300">Tháng:</label>
          <input
            id="portal-month"
            v-model="ui.selectedMonth"
            type="month"
            class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-600"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Hoạt động tháng</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{{ monthlyActivities.length }}</p>
        </div>
        <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Đã tham gia</p>
          <p class="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">{{ attendedCount }}</p>
        </div>
        <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Đã xin nghỉ</p>
          <p class="text-xl font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">{{ leaveCount }}</p>
        </div>
        <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Chuyên cần</p>
          <p class="text-xl font-bold text-brand-700 dark:text-brand-400 tabular-nums mt-0.5">{{ participationRate }}%</p>
        </div>
        <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 col-span-2 sm:col-span-1">
          <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ca đã đăng ký</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{{ totalMyRegsCount }}</p>
        </div>
      </div>
    </div>

    <!-- Activities Grid -->
    <div
      v-if="monthlyActivities.length === 0"
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-1.5"
    >
      <CalendarX2 class="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
      <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">
        Không có hoạt động trong tháng {{ selectedMonthLabel }}
      </p>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Chọn tháng khác để xem lịch sử hoặc chờ Quản trị viên cập nhật hoạt động mới.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <article
        v-for="act in monthlyActivities"
        :key="act.id"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-4"
      >
        <div class="space-y-2.5">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
              {{ act.semester || 'Hoạt động' }}
            </span>
            <span
              class="px-2 py-0.5 rounded border text-[11px] font-semibold"
              :class="getStatusBadge(act).classes"
            >
              {{ getStatusBadge(act).label }}
            </span>
          </div>

          <h3 class="text-sm font-bold text-slate-900 dark:text-white leading-snug">
            {{ act.name }}
          </h3>

          <div class="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <div class="flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span class="tabular-nums">
                {{ formatDate(act.date) }}
                <template v-if="act.endDate && act.endDate !== act.date"> — {{ formatDate(act.endDate) }}</template>
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span class="truncate">{{ act.location || 'Trường ĐH' }}</span>
            </div>
          </div>

          <p v-if="act.description" class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {{ act.description }}
          </p>

          <!-- Registered shifts for this activity -->
          <div v-if="getUserActivityRegs(act.id).length > 0" class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <p class="text-[11px] font-semibold text-brand-700 dark:text-brand-400">Ca đã đăng ký:</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="r in getUserActivityRegs(act.id)"
                :key="r.id"
                class="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-[11px] font-medium tabular-nums"
              >
                {{ formatDate(r.date) }} · {{ r.shiftType }}
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
          <button
            type="button"
            @click="openRegModal(act)"
            class="w-full py-2 px-3 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <CalendarPlus class="w-3.5 h-3.5" />
            <span>Đăng ký ca tham gia</span>
          </button>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="openCheckInModal(act)"
              :disabled="getRecord(act.id)?.status === 'present' || !canCheckInToday(act)"
              class="py-2 px-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition"
              :class="getRecord(act.id)?.status === 'present'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default'
                : (canCheckInToday(act)
                    ? 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed')"
            >
              <CheckCircle2 v-if="getRecord(act.id)?.status === 'present'" class="w-3.5 h-3.5" />
              <Camera v-else-if="canCheckInToday(act)" class="w-3.5 h-3.5" />
              <Lock v-else class="w-3.5 h-3.5" />
              <span>{{ getCheckInLabel(act) }}</span>
            </button>

            <button
              type="button"
              @click="$emit('open-leave-modal', act)"
              class="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FilePenLine class="w-3.5 h-3.5" />
              <span>Xin nghỉ</span>
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Register Activity Shift Modal -->
    <Transition name="modal">
      <div
        v-if="selectedActForReg"
        class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        @click.self="selectedActForReg = null"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Đăng ký ca hoạt động</h3>
              <p class="text-xs text-slate-500 truncate max-w-xs mt-0.5">{{ selectedActForReg.name }}</p>
            </div>
            <button type="button" @click="selectedActForReg = null" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="submitReg" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày tham gia</label>
              <select
                v-model="regForm.date"
                required
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              >
                <option v-for="d in availableDatesForReg" :key="d" :value="d">
                  {{ formatDate(d) }} {{ d === today ? '(Hôm nay)' : '' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ca tham gia</label>
              <select
                v-model="regForm.shiftType"
                required
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              >
                <option v-for="st in data.shiftTypes" :key="st.id || st.name" :value="st.name || st.id">
                  {{ st.name }} {{ st.time ? `(${st.time})` : '' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ghi chú (tùy chọn)</label>
              <input
                v-model="regForm.notes"
                type="text"
                placeholder="VD: Hỗ trợ hậu cần, đón khách..."
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
              />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                @click="selectedActForReg = null"
                class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
              >
                Xác nhận đăng ký
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Check-in Proof Camera / Upload Modal -->
    <Transition name="modal">
      <div
        v-if="selectedActForCheckIn"
        class="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto"
        @click.self="closeCheckInModal"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 my-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="min-w-0">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Điểm danh minh chứng thẻ sinh viên</h3>
              <p class="text-xs text-slate-500 truncate mt-0.5">{{ selectedActForCheckIn.name }}</p>
            </div>
            <button type="button" @click="closeCheckInModal" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Capture Mode Switch -->
          <div class="grid grid-cols-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              @click="setCaptureMode('camera')"
              class="py-1.5 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
              :class="captureMode === 'camera' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
            >
              <Camera class="w-3.5 h-3.5" />
              <span>Chụp camera</span>
            </button>
            <button
              type="button"
              @click="setCaptureMode('upload')"
              class="py-1.5 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
              :class="captureMode === 'upload' ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>Tải ảnh lên</span>
            </button>
          </div>

          <!-- Preview or Capture Area -->
          <div v-if="proofBase64" class="space-y-2.5">
            <div class="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex justify-center">
              <img :src="proofBase64" alt="Ảnh minh chứng" class="max-h-64 object-contain" />
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 font-mono truncate">{{ standardFileName }}</span>
              <button type="button" @click="retakePhoto" class="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer shrink-0 ml-2">
                Chọn lại
              </button>
            </div>
          </div>

          <div v-else-if="captureMode === 'camera'" class="space-y-2.5">
            <div class="rounded-lg overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-700 aspect-[4/3] flex items-center justify-center">
              <video ref="videoEl" autoplay playsinline muted class="w-full h-full object-cover"></video>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="flipCamera"
                class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw class="w-3.5 h-3.5" />
                <span>Đổi cam</span>
              </button>
              <button
                type="button"
                @click="capturePhoto"
                class="flex-1 py-2 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera class="w-4 h-4" />
                <span>Chụp ảnh</span>
              </button>
            </div>
          </div>

          <div v-else class="space-y-2">
            <label class="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-brand-500 cursor-pointer text-center">
              <Upload class="w-6 h-6 text-slate-400" />
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Chọn ảnh thẻ sinh viên từ thiết bị</span>
              <span class="text-[11px] text-slate-400">Ảnh được tự động nén gọn trước khi đồng bộ Cloud</span>
              <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
            </label>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="closeCheckInModal"
              class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              :disabled="!proofBase64 || isSubmittingCheckIn"
              @click="confirmCheckIn"
              class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmittingCheckIn ? 'Đang gửi...' : 'Xác nhận điểm danh' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import {
  CalendarX2, Calendar, MapPin, CalendarPlus, CheckCircle2, Camera, Lock,
  FilePenLine, X, Upload, RefreshCw
} from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';
import { useAuthStore } from '../../stores/auth.js';
import { useUiStore } from '../../stores/ui.js';
import { getTodayStr, formatDate, getDateRange } from '../../utils/date.js';
import { compressImageFile, captureVideoFrameCompressed } from '../../utils/imageCompress.js';

defineEmits(['open-leave-modal']);

const data = useDataStore();
const auth = useAuthStore();
const ui = useUiStore();

const today = computed(() => getTodayStr());

const selectedMonthLabel = computed(() => {
  if (!ui.selectedMonth) return '';
  const [y, m] = ui.selectedMonth.split('-');
  return `${m}/${y}`;
});

const monthlyActivities = computed(() => {
  return data.activities.filter((a) => a.date && a.date.startsWith(ui.selectedMonth));
});

function getRecord(actId) {
  return data.getUserCheckInRecord(actId, auth.loggedInMemberId);
}

function getUserActivityRegs(actId) {
  return data.activityRegistrations.filter(
    (r) => r.activityId === actId && r.memberId === auth.loggedInMemberId
  );
}

const totalMyRegsCount = computed(() =>
  data.activityRegistrations.filter((r) => r.memberId === auth.loggedInMemberId).length
);

const attendedCount = computed(() =>
  monthlyActivities.value.filter((a) => getRecord(a.id)?.status === 'present').length
);

const leaveCount = computed(() =>
  monthlyActivities.value.filter((a) => getRecord(a.id)?.status === 'leave').length
);

const participationRate = computed(() => {
  if (monthlyActivities.value.length === 0) return 0;
  return Math.round((attendedCount.value / monthlyActivities.value.length) * 100);
});

function canCheckInToday(act) {
  const regs = getUserActivityRegs(act.id);
  if (regs.length > 0) return regs.some((r) => r.date === today.value);
  return getDateRange(act.date, act.endDate || act.date).includes(today.value);
}

function getStatusBadge(act) {
  const rec = getRecord(act.id);
  if (rec?.status === 'present') {
    return {
      label: rec.adminCheckedIn ? 'Đã điểm danh (Admin)' : 'Đã điểm danh',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    };
  }
  if (rec?.status === 'leave') {
    return {
      label: 'Đã xin nghỉ',
      classes: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    };
  }
  if (canCheckInToday(act)) {
    return {
      label: 'Mở điểm danh hôm nay',
      classes: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-800'
    };
  }
  if ((act.endDate || act.date) > today.value) {
    return {
      label: 'Sắp diễn ra',
      classes: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    };
  }
  return {
    label: 'Đã kết thúc',
    classes: 'bg-red-50 text-[#c8102e] border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
  };
}

function getCheckInLabel(act) {
  const rec = getRecord(act.id);
  if (rec?.status === 'present') return 'Đã điểm danh';
  if (canCheckInToday(act)) return 'Điểm danh';
  if ((act.endDate || act.date) > today.value) return 'Chưa đến ngày';
  return 'Quá hạn';
}

// Register shift modal
const selectedActForReg = ref(null);
const regForm = ref({ date: '', shiftType: 'Ca 1', notes: '' });

const availableDatesForReg = computed(() => {
  if (!selectedActForReg.value) return [];
  const all = getDateRange(selectedActForReg.value.date, selectedActForReg.value.endDate || selectedActForReg.value.date);
  const upcoming = all.filter((d) => d >= today.value);
  return upcoming.length > 0 ? upcoming : all;
});

function openRegModal(act) {
  selectedActForReg.value = act;
  const dates = getDateRange(act.date, act.endDate || act.date).filter((d) => d >= today.value);
  regForm.value = {
    date: dates[0] || act.date,
    shiftType: data.shiftTypes[0]?.name || 'Ca 1',
    notes: ''
  };
}

async function submitReg() {
  if (!selectedActForReg.value) return;
  await data.registerActivityShift({
    activityId: selectedActForReg.value.id,
    date: regForm.value.date,
    shiftType: regForm.value.shiftType,
    notes: regForm.value.notes
  });
  selectedActForReg.value = null;
}

// Check-in camera / upload modal
const selectedActForCheckIn = ref(null);
const captureMode = ref('camera');
const proofBase64 = ref('');
const facingMode = ref('environment');
const videoEl = ref(null);
const isSubmittingCheckIn = ref(false);
let mediaStream = null;

const standardFileName = computed(() => {
  const name = data.getMemberName(auth.loggedInMemberId) || 'ThanhVien';
  const datePart = (selectedActForCheckIn.value?.date || today.value).split('-').reverse().join('_');
  return `${name} - ${auth.loggedInMemberId} - ${datePart}.jpg`;
});

const proofFolderDate = computed(() => {
  const act = selectedActForCheckIn.value;
  const datePart = (act?.date || today.value).split('-').reverse().join('_');
  return act?.name ? `${datePart} _ ${act.name}` : datePart;
});

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
}

async function startCamera() {
  stopCamera();
  if (!navigator.mediaDevices?.getUserMedia) {
    captureMode.value = 'upload';
    return;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode.value, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream;
      videoEl.value.play().catch(() => {});
    }
  } catch {
    captureMode.value = 'upload';
  }
}

function setCaptureMode(mode) {
  captureMode.value = mode;
  if (mode === 'camera' && !proofBase64.value) {
    setTimeout(startCamera, 80);
  } else {
    stopCamera();
  }
}

function flipCamera() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
  startCamera();
}

function capturePhoto() {
  if (!videoEl.value) return;
  proofBase64.value = captureVideoFrameCompressed(videoEl.value);
  stopCamera();
}

async function handleFileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    proofBase64.value = await compressImageFile(file);
  } catch (err) {
    ui.showToast(err?.message || 'Không thể xử lý ảnh.', 'error');
  }
}

function retakePhoto() {
  proofBase64.value = '';
  if (captureMode.value === 'camera') setTimeout(startCamera, 80);
}

function openCheckInModal(act) {
  if (getRecord(act.id)?.status === 'present' || !canCheckInToday(act)) return;
  selectedActForCheckIn.value = act;
  proofBase64.value = '';
  captureMode.value = 'camera';
  setTimeout(startCamera, 100);
}

function closeCheckInModal() {
  stopCamera();
  selectedActForCheckIn.value = null;
  proofBase64.value = '';
}

async function confirmCheckIn() {
  if (!selectedActForCheckIn.value || !proofBase64.value) return;
  isSubmittingCheckIn.value = true;
  try {
    await data.checkInActivity({
      activityId: selectedActForCheckIn.value.id,
      proofImage: proofBase64.value,
      proofFileName: standardFileName.value,
      proofFolderDate: proofFolderDate.value
    });
    closeCheckInModal();
  } finally {
    isSubmittingCheckIn.value = false;
  }
}

onBeforeUnmount(stopCamera);
</script>
