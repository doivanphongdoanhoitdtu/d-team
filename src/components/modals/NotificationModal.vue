<template>
  <Transition name="modal">
    <div
      v-if="ui.showNotificationModal"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
      @click.self="ui.showNotificationModal = false"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 my-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Thông báo &amp; nhắc lịch trực</h3>
            <p class="text-xs text-slate-500 mt-0.5">Nhắc nhở công việc cần xử lý và cài đặt trình duyệt.</p>
          </div>
          <button type="button" @click="ui.showNotificationModal = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Alerts -->
        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          <div
            v-for="(a, idx) in alerts"
            :key="idx"
            class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-3 text-xs"
          >
            <div>
              <div class="font-bold text-slate-900 dark:text-white">{{ a.title }}</div>
              <p class="text-slate-600 dark:text-slate-400 mt-0.5">{{ a.message }}</p>
            </div>
            <button
              v-if="a.tab"
              type="button"
              @click="ui.currentTab = a.tab; ui.showNotificationModal = false"
              class="px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-700 text-white font-semibold shrink-0 cursor-pointer"
            >
              {{ a.actionLabel }}
            </button>
          </div>

          <div v-if="alerts.length === 0" class="py-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
            Hiện không có lời nhắc nào đang chờ xử lý.
          </div>
        </div>

        <!-- Browser Notification Settings -->
        <div class="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-slate-800 dark:text-slate-200">Nhắc ca trực trong phiên làm việc</span>
            <span
              class="px-2 py-0.5 rounded text-[11px] font-semibold"
              :class="perm === 'granted' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'"
            >
              {{ perm === 'granted' ? 'Đã bật' : 'Chưa bật' }}
            </span>
          </div>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Trình duyệt sẽ gửi thông báo trước 15 phút cho các ca trực sắp bắt đầu khi thẻ trang đang mở.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="perm !== 'granted'"
              type="button"
              @click="askPermission"
              class="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
            >
              Cấp quyền thông báo
            </button>
            <button
              type="button"
              @click="sendTest"
              class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
            >
              Thử thông báo
            </button>
          </div>
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="ui.showNotificationModal = false"
            class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';
import { useAuthStore } from '../../stores/auth.js';
import { useDataStore } from '../../stores/data.js';
import { getTodayStr, formatDate } from '../../utils/date.js';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showWebNotification
} from '../../utils/notifications.js';

const ui = useUiStore();
const auth = useAuthStore();
const data = useDataStore();

const perm = ref(getNotificationPermission());

watch(() => ui.showNotificationModal, (open) => {
  if (open) perm.value = getNotificationPermission();
});

const alerts = computed(() => {
  const list = [];
  const today = getTodayStr();

  if (auth.isAdmin) {
    const pending = data.leaveRequests.filter((l) => l.status === 'Chờ duyệt').length;
    if (pending > 0) {
      list.push({
        title: `${pending} đơn xin nghỉ phép chờ duyệt`,
        message: 'Có đơn xin nghỉ của thành viên đang chờ Ban Điều hành phê duyệt.',
        tab: 'leave',
        actionLabel: 'Duyệt đơn'
      });
    }
    if (auth.needsPasswordUpgradeNotice) {
      list.push({
        title: 'Khuyến nghị đổi mật khẩu quản trị',
        message: 'Tài khoản vừa được nâng cấp mã hóa PBKDF2. Bạn nên đặt mật khẩu riêng mạnh hơn.',
        tab: null
      });
    }
  } else {
    const myRegsToday = data.registrations.filter(
      (r) => r.memberId === auth.loggedInMemberId && r.date === today
    );
    for (const reg of myRegsToday) {
      const done = data.shifts.some(
        (s) => s.memberId === auth.loggedInMemberId && s.date === today && s.shiftType === reg.shiftType
      );
      if (!done) {
        list.push({
          title: `Lịch trực hôm nay: ${reg.shiftType}`,
          message: `Bạn có ca trực ${reg.shiftType} ngày ${formatDate(today)}. Vào mục Điểm danh sau khi hoàn thành ca.`,
          tab: 'entry',
          actionLabel: 'Điểm danh'
        });
      }
    }

    const myPending = data.leaveRequests.filter(
      (l) => l.memberId === auth.loggedInMemberId && l.status === 'Chờ duyệt'
    ).length;
    if (myPending > 0) {
      list.push({
        title: `${myPending} đơn xin nghỉ đang chờ duyệt`,
        message: 'Quản trị viên sẽ xem xét và cập nhật trạng thái đơn của bạn.',
        tab: 'leave',
        actionLabel: 'Xem đơn'
      });
    }
  }

  return list;
});

async function askPermission() {
  perm.value = await requestNotificationPermission();
  if (perm.value === 'granted') {
    ui.showToast('Đã bật quyền thông báo trình duyệt.', 'success');
  } else if (perm.value === 'denied') {
    ui.showToast('Quyền thông báo đã bị từ chối trong cài đặt trình duyệt.', 'error');
  }
}

async function sendTest() {
  if (perm.value !== 'granted') {
    await askPermission();
  }
  if (perm.value === 'granted') {
    await showWebNotification('Hệ thống Quản lý ĐVP', {
      body: 'Thông báo nhắc lịch trực đang hoạt động ổn định.'
    });
    ui.showToast('Đã gửi thông báo thử.', 'success');
  }
}
</script>
