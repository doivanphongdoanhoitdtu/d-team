<template>
  <div class="space-y-5">
    <!-- Top Summary Strip -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Quản lý &amp; theo dõi hoạt động
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi hạn nộp hồ sơ điểm rèn luyện (+3 ngày sau kết thúc), điểm danh và xuất báo cáo Excel.
          </p>
        </div>
        <a
          :href="GOOGLE_DRIVE_FOLDER_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition shrink-0"
        >
          <ExternalLink class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Thư mục Google Drive</span>
        </a>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tổng hoạt động</p>
            <p class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{{ summary.totalExecuted }}</p>
          </div>
          <div class="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <CalendarCheck class="w-5 h-5" />
          </div>
        </div>

        <div class="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Đã gửi ĐRL đúng hạn</p>
            <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">{{ summary.submittedOnTimeCount }}</p>
          </div>
          <div class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 class="w-5 h-5" />
          </div>
        </div>

        <div class="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trễ hạn (&gt; 3 ngày)</p>
            <p class="text-2xl font-bold text-[#c8102e] dark:text-red-400 tabular-nums mt-0.5">{{ summary.overdueCount }}</p>
          </div>
          <div class="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/50 text-[#c8102e] dark:text-red-400 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Main 2-Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Create Activity Form -->
      <section class="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 h-fit space-y-4">
        <div class="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <PlusCircle class="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">Tạo hoạt động mới</h3>
        </div>

        <form @submit.prevent="handleCreate" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên hoạt động <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="VD: Tập huấn Kỹ năng Quản trò"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Địa điểm tổ chức <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model="form.location"
              type="text"
              required
              placeholder="VD: Hội trường 2A / Sân trung tâm"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
            />
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ngày bắt đầu <span class="text-[#c8102e]">*</span>
              </label>
              <input
                v-model="form.date"
                type="date"
                required
                class="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
              />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ngày kết thúc <span class="text-[#c8102e]">*</span>
              </label>
              <input
                v-model="form.endDate"
                type="date"
                :min="form.date"
                required
                class="w-full px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
              />
            </div>
          </div>

          <p v-if="form.endDate" class="text-[11px] text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800/60 px-2.5 py-1.5 rounded-md">
            Hạn gửi hồ sơ (+3 ngày): <strong class="tabular-nums">{{ formatDate(computedDeadline) }}</strong>
          </p>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ngày gửi hồ sơ (tùy chọn)
            </label>
            <input
              v-model="form.submitDate"
              type="date"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-semibold text-slate-700 dark:text-slate-300">
                Học kỳ <span class="text-[#c8102e]">*</span>
              </label>
              <button
                type="button"
                @click="showSemesterModal = true"
                class="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Quản lý học kỳ
              </button>
            </div>
            <select
              v-model="form.semester"
              required
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
            >
              <option value="" disabled>-- Chọn học kỳ --</option>
              <option v-for="s in data.semesters" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mô tả / lưu ý
            </label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Nội dung hỗ trợ, trang phục, lưu ý..."
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
            ></textarea>
          </div>

          <button
            type="submit"
            class="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Tạo hoạt động</span>
          </button>
        </form>
      </section>

      <!-- Activity List -->
      <section class="lg:col-span-8 space-y-4">
        <!-- Toolbar -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
          <div class="relative flex-1">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm theo tên hoạt động hoặc mã số..."
              class="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <select
              v-model="selectedSemester"
              class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-600"
            >
              <option value="all">Tất cả học kỳ ({{ data.activities.length }})</option>
              <option v-for="s in data.semesters" :key="s" :value="s">{{ s }}</option>
            </select>
            <button
              type="button"
              @click="showSemesterModal = true"
              class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">Học kỳ</span>
            </button>
          </div>
        </div>

        <!-- Empty -->
        <div
          v-if="filteredActivities.length === 0"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-1.5"
        >
          <CalendarX2 class="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Chưa có hoạt động phù hợp</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">Sử dụng biểu mẫu bên trái để tạo hoạt động mới hoặc thay đổi bộ lọc.</p>
        </div>

        <!-- Activity Cards -->
        <div v-else class="space-y-3">
          <article
            v-for="act in filteredActivities"
            :key="act.id"
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 rounded bg-brand-600 text-white text-[11px] font-mono font-semibold">
                  #{{ getDerived(act).codeId }}
                </span>
                <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                  {{ act.semester || 'Chưa gắn học kỳ' }}
                </span>
              </div>

              <div class="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold">
                <span
                  class="px-2 py-0.5 rounded border"
                  :class="progressBadgeClass(getDerived(act).progressStatus)"
                >
                  {{ getDerived(act).progressStatus }}
                </span>
                <span
                  v-if="getDerived(act).conclusionStatus !== 'Chưa có'"
                  class="px-2 py-0.5 rounded border"
                  :class="conclusionBadgeClass(getDerived(act).conclusionStatus)"
                >
                  {{ getDerived(act).conclusionStatus }}
                </span>
              </div>
            </div>

            <div>
              <h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                {{ act.name }}
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{{ getDerived(act).location }}</span>
              </p>
            </div>

            <!-- Bilingual Preview -->
            <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 rounded-lg px-3 py-2 text-xs space-y-0.5">
              <p class="text-slate-700 dark:text-slate-200">
                <span class="font-semibold text-slate-500 dark:text-slate-400">VN:</span> {{ getDerived(act).contentVN }}
              </p>
              <p class="text-slate-500 dark:text-slate-400">
                <span class="font-semibold">EN:</span> {{ getDerived(act).contentEN }}
              </p>
            </div>

            <!-- Dates Row -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              <div>
                <span class="block text-[11px] text-slate-500 dark:text-slate-400">Bắt đầu</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{{ formatDate(getDerived(act).startDate) }}</span>
              </div>
              <div>
                <span class="block text-[11px] text-slate-500 dark:text-slate-400">Kết thúc</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{{ formatDate(getDerived(act).endDate) }}</span>
              </div>
              <div>
                <span class="block text-[11px] text-slate-500 dark:text-slate-400">Hạn nộp (+3 ngày)</span>
                <span class="font-semibold text-amber-700 dark:text-amber-400 tabular-nums">{{ formatDate(getDerived(act).deadlineDate) }}</span>
              </div>
              <div>
                <span class="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">Ngày gửi thực tế</span>
                <input
                  type="date"
                  :value="act.submitDate"
                  @change="data.updateActivitySubmitDate(act.id, $event.target.value)"
                  class="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:border-brand-600"
                />
              </div>
            </div>

            <!-- Action Row -->
            <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                @click="openExportModal(act)"
                class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet class="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="$emit('open-detail', act)"
                  class="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/40 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Users class="w-3.5 h-3.5" />
                  <span>Điểm danh ({{ data.getActivityStats(act.id).totalCheckIns }})</span>
                </button>
                <button
                  type="button"
                  @click="askDeleteActivity(act)"
                  class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#c8102e] hover:border-red-300 dark:hover:text-red-400 transition cursor-pointer"
                  title="Xóa hoạt động"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- Semester Manager Modal -->
    <Transition name="modal">
      <div
        v-if="showSemesterModal"
        class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        @click.self="showSemesterModal = false"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Quản lý danh sách học kỳ</h3>
            <button type="button" @click="showSemesterModal = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleAddSemester" class="flex gap-2">
            <input
              v-model="newSemesterName"
              type="text"
              required
              placeholder="VD: Học kỳ 1 (2026-2027)"
              class="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
            <button
              type="submit"
              class="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              Thêm
            </button>
          </form>

          <div class="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div v-if="data.semesters.length === 0" class="p-4 text-center text-xs text-slate-400">
              Chưa có học kỳ nào.
            </div>
            <div v-for="s in data.semesters" :key="s" class="px-3 py-2.5 flex items-center justify-between text-xs">
              <span class="font-medium text-slate-800 dark:text-slate-200">{{ s }}</span>
              <button
                type="button"
                @click="askDeleteSemester(s)"
                class="text-xs font-semibold text-[#c8102e] dark:text-red-400 hover:underline cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Export Type Modal -->
    <Transition name="modal">
      <div
        v-if="showExportModal"
        class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        @click.self="showExportModal = false"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="min-w-0">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Chọn mẫu xuất Excel</h3>
              <p class="text-xs text-slate-500 truncate mt-0.5">{{ selectedExportAct?.name }}</p>
            </div>
            <button type="button" @click="showExportModal = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-2.5">
            <button
              type="button"
              @click="triggerExport('checkin')"
              class="w-full p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-500 bg-slate-50 dark:bg-slate-800/60 text-left space-y-1 transition cursor-pointer"
            >
              <div class="text-xs font-bold text-slate-900 dark:text-white">
                1. Danh sách điểm danh (Nộp điểm rèn luyện)
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Bảng dọc gồm STT, MSSV, Họ tên, Ban, Thời gian điểm danh, Trạng thái và Minh chứng.
              </p>
            </button>

            <button
              type="button"
              @click="triggerExport('registration')"
              class="w-full p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-500 bg-slate-50 dark:bg-slate-800/60 text-left space-y-1 transition cursor-pointer"
            >
              <div class="text-xs font-bold text-slate-900 dark:text-white">
                2. Danh sách đăng ký ca (Ma trận Ngày / Ca)
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Bảng phân ca ngang theo từng Ngày và Ca 1–4 chuẩn mẫu phân công trực.
              </p>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  ExternalLink, CalendarCheck, CheckCircle2, AlertTriangle, PlusCircle, Plus,
  Search, X, SlidersHorizontal, CalendarX2, MapPin, FileSpreadsheet, Users, Trash2
} from 'lucide-vue-next';
import { useDataStore, GOOGLE_DRIVE_FOLDER_URL } from '../../stores/data.js';
import { useUiStore } from '../../stores/ui.js';
import { getTodayStr, addDays, formatDate } from '../../utils/date.js';
import { exportActivityCheckInExcel, exportActivityRegistrationMatrixExcel } from '../../utils/exporters.js';

defineEmits(['open-detail']);

const data = useDataStore();
const ui = useUiStore();

const form = ref({
  name: '',
  location: '',
  date: getTodayStr(),
  endDate: getTodayStr(),
  submitDate: '',
  semester: data.semesters[0] || '',
  description: ''
});

watch(
  () => data.semesters,
  (list) => {
    if (!form.value.semester && list.length > 0) {
      form.value.semester = list[0];
    }
  },
  { immediate: true }
);

const computedDeadline = computed(() => addDays(form.value.endDate || form.value.date, 3));
const summary = computed(() => data.adminActivitySummaryStats);

const searchQuery = ref('');
const selectedSemester = ref('all');
const showSemesterModal = ref(false);
const newSemesterName = ref('');
const showExportModal = ref(false);
const selectedExportAct = ref(null);

const filteredActivities = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return data.activities.filter((act) => {
    const matchSearch = !q || act.name.toLowerCase().includes(q) || String(act.codeId || act.code).includes(q);
    const matchSem = selectedSemester.value === 'all' || act.semester === selectedSemester.value;
    return matchSearch && matchSem;
  });
});

function getDerived(act) {
  return data.computeActivityDerivedFields(act);
}

function progressBadgeClass(status) {
  if (status === 'Đã xử lý') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  if (status === 'Đã quá hạn') return 'bg-red-50 text-[#c8102e] border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
  return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
}

function conclusionBadgeClass(status) {
  if (status === 'Gửi sớm hạn') return 'bg-emerald-700 text-white border-emerald-700';
  if (status === 'Gửi đúng hạn') return 'bg-brand-600 text-white border-brand-600';
  return 'bg-[#c8102e] text-white border-[#c8102e]';
}

async function handleCreate() {
  const ok = await data.createActivity({ ...form.value });
  if (ok) {
    form.value.name = '';
    form.value.location = '';
    form.value.submitDate = '';
    form.value.description = '';
  }
}

async function handleAddSemester() {
  if (!newSemesterName.value.trim()) return;
  await data.addSemester(newSemesterName.value.trim());
  if (!form.value.semester) form.value.semester = newSemesterName.value.trim();
  newSemesterName.value = '';
}

function askDeleteSemester(semName) {
  ui.openConfirm({
    title: 'Xóa học kỳ?',
    message: `Bạn có chắc muốn xóa học kỳ "${semName}" khỏi danh sách?`,
    confirmText: 'Xóa học kỳ',
    action: () => data.deleteSemester(semName)
  });
}

function askDeleteActivity(act) {
  ui.openConfirm({
    title: 'Xóa hoạt động?',
    message: `Xóa hoạt động "${act.name}" cùng toàn bộ lượt đăng ký và điểm danh liên quan?`,
    confirmText: 'Xóa hoạt động',
    action: () => data.deleteActivity(act.id)
  });
}

function openExportModal(act) {
  selectedExportAct.value = act;
  showExportModal.value = true;
}

async function triggerExport(type) {
  const act = selectedExportAct.value;
  showExportModal.value = false;
  if (!act) return;
  const derived = data.computeActivityDerivedFields(act);
  const stats = data.getActivityStats(act.id);

  if (type === 'registration') {
    await exportActivityRegistrationMatrixExcel({
      activity: act,
      derived,
      registrations: stats.regsList,
      getMemberName: data.getMemberName,
      notify: ui.showToast
    });
  } else {
    await exportActivityCheckInExcel({
      activity: act,
      derived,
      checkIns: stats.allRecords,
      registrations: stats.regsList,
      getMemberName: data.getMemberName,
      getMemberDept: data.getMemberDept,
      notify: ui.showToast
    });
  }
}
</script>
