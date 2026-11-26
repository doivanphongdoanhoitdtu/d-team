<template>
  <div class="min-h-screen flex flex-col">
    <NetworkStatusBanner @retry="ui.checkNetworkStatus(() => data.initCloud(false))" />
    <Toast />

    <!-- Unauthenticated View -->
    <LoginGatekeeper v-if="!auth.isLoggedIn" />

    <!-- Authenticated App Shell -->
    <div v-else class="flex-1 flex flex-col lg:flex-row min-w-0">
      <AppSidebar :primary-tabs="primaryTabs" :admin-tabs="adminTabs" />

      <div class="flex-1 min-w-0 flex flex-col">
        <AppTopBar
          :active-tab-title="activeTabMeta.label"
          :active-tab-subtitle="activeTabMeta.subtitle"
          :unread-count="unreadCount"
        />

      <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 pb-24 lg:pb-8 space-y-5">
        <!-- Password Upgrade Recommendation Banner for Migrated Admins -->
        <div
          v-if="auth.isAdmin && auth.needsPasswordUpgradeNotice"
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs no-print"
        >
          <span class="text-amber-900 dark:text-amber-200 font-medium">
            Mật khẩu quản trị đã được nâng cấp mã hóa PBKDF2-SHA256. Bạn nên đặt mật khẩu mới mạnh hơn để tăng bảo mật.
          </span>
          <button
            type="button"
            @click="ui.showChangePasswordModal = true"
            class="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold cursor-pointer"
          >
            Đổi mật khẩu ngay
          </button>
        </div>

        <!-- Global Month / Week Filter Bar -->
        <div
          v-if="showPeriodFilter"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs no-print"
        >
          <div class="flex items-center gap-2">
            <Calendar class="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <label for="global-month" class="font-semibold text-slate-700 dark:text-slate-300">Tháng báo cáo:</label>
            <input
              id="global-month"
              v-model="ui.selectedMonth"
              type="month"
              class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-600"
            />
          </div>

          <div class="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              @click="ui.selectedWeek = 'all'"
              class="px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0"
              :class="ui.selectedWeek === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
            >
              Cả tháng
            </button>
            <button
              v-for="w in REPORTING_WEEKS"
              :key="w.id"
              type="button"
              @click="ui.selectedWeek = w.id"
              class="px-2.5 py-1.5 rounded-lg font-semibold transition cursor-pointer shrink-0"
              :class="ui.selectedWeek === w.id ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
            >
              {{ w.label }} ({{ w.range }})
            </button>
          </div>
        </div>

        <!-- Active View (v-if so only active view mounts!) -->
        <template v-if="ui.currentTab === 'activities'">
          <AdminActivityManager v-if="auth.isAdmin" @open-detail="openActivityDetail" />
          <UserActivityPortal v-else @open-leave-modal="openLeaveActivity" />
        </template>

        <TabShiftEntry v-else-if="ui.currentTab === 'entry'" />
        <TabShiftRegister v-else-if="ui.currentTab === 'register'" />
        <TabMyRegisteredShifts v-else-if="ui.currentTab === 'my-shifts'" />
        <TabLeaveRequests v-else-if="ui.currentTab === 'leave'" />
        <TabDashboard v-else-if="ui.currentTab === 'dashboard' && auth.isAdmin" />
        <TabShiftHistory v-else-if="ui.currentTab === 'history' && auth.isAdmin" />
        <TabMembersList
          v-else-if="ui.currentTab === 'members' && auth.isAdmin"
          @open-member-modal="openMemberModal"
          @open-batch="showBatchModal = true"
        />
      </main>

        <MobileBottomNav :all-tabs="allTabs" />
      </div>
    </div>

    <!-- Global Modals -->
    <ConfirmDeleteModal />
    <ShiftSettingsModal />
    <ConfigModal />
    <ChangePasswordModal />
    <NotificationModal />

    <MemberModal
      :show="showMemberModal"
      :editing-member="editingMember"
      @close="showMemberModal = false"
    />
    <BatchImportModal
      :show="showBatchModal"
      @close="showBatchModal = false"
    />
    <ActivityDetailModal
      :show="showActivityDetail"
      :activity="selectedActivityForDetail"
      @close="showActivityDetail = false"
    />
    <LeaveActivityModal
      :show="showLeaveActivity"
      :activity="selectedActivityForLeave"
      @close="showLeaveActivity = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  Calendar, CalendarCheck, PenSquare, CalendarPlus, ClipboardList,
  FilePenLine, BarChart3, History, Users
} from 'lucide-vue-next';

import { useUiStore } from './stores/ui.js';
import { useAuthStore } from './stores/auth.js';
import { useDataStore } from './stores/data.js';
import { REPORTING_WEEKS, getTodayStr } from './utils/date.js';
import { registerServiceWorker, syncUpcomingShiftReminders, clearAllShiftReminders } from './utils/notifications.js';

import Toast from './components/common/Toast.vue';
import NetworkStatusBanner from './components/common/NetworkStatusBanner.vue';
import AppSidebar from './components/common/AppSidebar.vue';
import AppTopBar from './components/common/AppTopBar.vue';
import MobileBottomNav from './components/common/MobileBottomNav.vue';
import LoginGatekeeper from './components/auth/LoginGatekeeper.vue';

import AdminActivityManager from './components/activities/AdminActivityManager.vue';
import UserActivityPortal from './components/activities/UserActivityPortal.vue';
import TabShiftEntry from './components/tabs/TabShiftEntry.vue';
import TabShiftRegister from './components/tabs/TabShiftRegister.vue';
import TabMyRegisteredShifts from './components/tabs/TabMyRegisteredShifts.vue';
import TabLeaveRequests from './components/tabs/TabLeaveRequests.vue';
import TabDashboard from './components/tabs/TabDashboard.vue';
import TabShiftHistory from './components/tabs/TabShiftHistory.vue';
import TabMembersList from './components/tabs/TabMembersList.vue';

import ConfirmDeleteModal from './components/modals/ConfirmDeleteModal.vue';
import ShiftSettingsModal from './components/modals/ShiftSettingsModal.vue';
import ConfigModal from './components/modals/ConfigModal.vue';
import ChangePasswordModal from './components/modals/ChangePasswordModal.vue';
import NotificationModal from './components/modals/NotificationModal.vue';
import MemberModal from './components/modals/MemberModal.vue';
import BatchImportModal from './components/modals/BatchImportModal.vue';
import ActivityDetailModal from './components/modals/ActivityDetailModal.vue';
import LeaveActivityModal from './components/modals/LeaveActivityModal.vue';

const ui = useUiStore();
const auth = useAuthStore();
const data = useDataStore();

// Local modal state
const showMemberModal = ref(false);
const editingMember = ref(null);
const showBatchModal = ref(false);

const showActivityDetail = ref(false);
const selectedActivityForDetail = ref(null);

const showLeaveActivity = ref(false);
const selectedActivityForLeave = ref(null);

function openMemberModal(m = null) {
  editingMember.value = m;
  showMemberModal.value = true;
}

function openActivityDetail(act) {
  selectedActivityForDetail.value = act;
  showActivityDetail.value = true;
}

function openLeaveActivity(act) {
  selectedActivityForLeave.value = act;
  showLeaveActivity.value = true;
}

const pendingLeaveCount = computed(() =>
  data.leaveRequests.filter((l) => l.status === 'Chờ duyệt').length
);

const primaryTabs = computed(() => [
  {
    id: 'activities',
    label: auth.isAdmin ? 'Quản lý hoạt động' : 'Trang hoạt động',
    shortLabel: 'Hoạt động',
    subtitle: 'Quản lý hoạt động học kỳ, đăng ký ca và điểm danh',
    icon: CalendarCheck
  },
  {
    id: 'entry',
    label: 'Điểm danh ca trực',
    shortLabel: 'Điểm danh',
    subtitle: 'Ghi nhận ca trực văn phòng từ sổ gốc',
    icon: PenSquare
  },
  {
    id: 'register',
    label: 'Đăng ký ca trực',
    shortLabel: 'Đăng ký',
    subtitle: 'Đăng ký và tra cứu lịch trực dự kiến',
    icon: CalendarPlus
  },
  {
    id: 'my-shifts',
    label: 'Ca đã đăng ký',
    shortLabel: 'Lịch của tôi',
    subtitle: 'Tổng hợp ca trực tuần và ca hoạt động cá nhân',
    icon: ClipboardList
  },
  {
    id: 'leave',
    label: 'Xin nghỉ phép',
    shortLabel: 'Nghỉ phép',
    subtitle: 'Nộp và xét duyệt đơn xin nghỉ ca trực / hoạt động',
    icon: FilePenLine,
    badge: auth.isAdmin && pendingLeaveCount.value > 0 ? pendingLeaveCount.value : null
  }
]);

const adminTabs = computed(() => {
  if (!auth.isAdmin) return [];
  return [
    {
      id: 'dashboard',
      label: 'Thống kê & chỉ tiêu',
      shortLabel: 'Thống kê',
      subtitle: 'Biểu đồ và ma trận đánh giá chỉ tiêu thành viên',
      icon: BarChart3
    },
    {
      id: 'history',
      label: 'Nhật ký & ma trận',
      shortLabel: 'Nhật ký',
      subtitle: 'Bảng phân ca ma trận và nhật ký sổ gốc',
      icon: History
    },
    {
      id: 'members',
      label: 'Danh sách thành viên',
      shortLabel: 'Thành viên',
      subtitle: 'Quản lý danh sách MSSV, Ban và phân quyền',
      icon: Users
    }
  ];
});

const allTabs = computed(() => [...primaryTabs.value, ...adminTabs.value]);

const activeTabMeta = computed(() => {
  return allTabs.value.find((t) => t.id === ui.currentTab) || { label: 'Hệ thống ĐVP', subtitle: '' };
});

const showPeriodFilter = computed(() =>
  ['entry', 'register', 'dashboard', 'history', 'my-shifts'].includes(ui.currentTab)
);

const unreadCount = computed(() => {
  if (auth.isAdmin) return pendingLeaveCount.value;
  if (!auth.loggedInMemberId) return 0;
  const today = getTodayStr();
  const uncompletedToday = data.registrations.filter((r) => {
    if (r.memberId !== auth.loggedInMemberId || r.date !== today) return false;
    return !data.shifts.some(
      (s) => s.memberId === auth.loggedInMemberId && s.date === today && s.shiftType === r.shiftType
    );
  }).length;
  const myPending = data.leaveRequests.filter(
    (l) => l.memberId === auth.loggedInMemberId && l.status === 'Chờ duyệt'
  ).length;
  return uncompletedToday + myPending;
});

// Guard non-admin from admin tabs
watch(() => auth.currentUserRole, (role) => {
  if (role !== 'admin' && ['dashboard', 'history', 'members'].includes(ui.currentTab)) {
    ui.currentTab = 'activities';
  }
});

// On-demand archive loading when choosing older month
watch(() => ui.selectedMonth, (newMonth) => {
  if (newMonth) data.fetchArchiveMonth(newMonth);
});

// Sync upcoming shift reminders cleanly (using registrations, not completed shifts!)
watch(
  () => [auth.isLoggedIn, auth.loggedInMemberId, data.registrations.length],
  () => {
    if (auth.isLoggedIn && auth.loggedInMemberId) {
      const myRegs = data.registrations.filter((r) => r.memberId === auth.loggedInMemberId);
      syncUpcomingShiftReminders(myRegs, data.getMemberName(auth.loggedInMemberId));
    } else {
      clearAllShiftReminders();
    }
  }
);

// Keyboard Escape closes open modals
function handleKeydown(e) {
  if (e.key !== 'Escape') return;
  if (ui.confirmModal.show) return ui.closeConfirm();
  if (showActivityDetail.value) return (showActivityDetail.value = false);
  if (showLeaveActivity.value) return (showLeaveActivity.value = false);
  if (showMemberModal.value) return (showMemberModal.value = false);
  if (showBatchModal.value) return (showBatchModal.value = false);
  if (ui.showChangePasswordModal) return (ui.showChangePasswordModal = false);
  if (ui.showShiftSettingsModal) return (ui.showShiftSettingsModal = false);
  if (ui.showConfigModal) return (ui.showConfigModal = false);
  if (ui.showNotificationModal) return (ui.showNotificationModal = false);
  if (ui.showMobileMoreSheet) return (ui.showMobileMoreSheet = false);
}

onMounted(async () => {
  ui.applyTheme();
  registerServiceWorker();
  window.addEventListener('keydown', handleKeydown);

  await data.initCloud(false);
  await auth.restoreSession();

  ui.initNetworkListeners(() => {
    if (!data.isCloudConnected) data.initCloud(false);
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  clearAllShiftReminders();
});
</script>
