import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getMonthStr } from '../utils/date.js';

export const useUiStore = defineStore('ui', () => {
  const isDarkMode = ref(
    typeof localStorage !== 'undefined' && localStorage.getItem('theme_mode') === 'dark'
  );
  const currentTab = ref('activities');
  const selectedMonth = ref(getMonthStr());
  const selectedWeek = ref('all');

  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isCheckingNetwork = ref(false);

  const toast = ref({ show: false, message: '', type: 'success' });
  let toastTimer = null;

  const confirmModal = ref({
    show: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    variant: 'danger',
    action: null
  });

  const showConfigModal = ref(false);
  const showShiftSettingsModal = ref(false);
  const showNotificationModal = ref(false);
  const showChangePasswordModal = ref(false);
  const showMobileMoreSheet = ref(false);

  function applyTheme() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDarkMode.value);
  }

  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value;
    try {
      localStorage.setItem('theme_mode', isDarkMode.value ? 'dark' : 'light');
    } catch {
      // ignore
    }
    applyTheme();
  }

  function showToast(message, type = 'success', duration = 3500) {
    toast.value = { show: true, message, type };
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.value.show = false;
    }, duration);
  }

  function openConfirm({ title, message, confirmText = 'Xác nhận', variant = 'danger', action }) {
    confirmModal.value = { show: true, title, message, confirmText, variant, action };
  }

  function closeConfirm() {
    confirmModal.value.show = false;
    confirmModal.value.action = null;
  }

  async function executeConfirm() {
    const fn = confirmModal.value.action;
    closeConfirm();
    if (typeof fn === 'function') {
      await fn();
    }
  }

  function initNetworkListeners(onReconnect) {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      isOnline.value = true;
      showToast('Đã khôi phục kết nối mạng.', 'success');
      onReconnect?.();
    });
    window.addEventListener('offline', () => {
      isOnline.value = false;
      showToast('Mất kết nối mạng. Hệ thống chuyển sang chế độ ngoại tuyến.', 'warning');
    });
  }

  async function checkNetworkStatus(onReconnect) {
    isCheckingNetwork.value = true;
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        isOnline.value = true;
        onReconnect?.();
      } else {
        isOnline.value = false;
        showToast('Thiết bị hiện vẫn chưa có kết nối Internet.', 'error');
      }
    } finally {
      isCheckingNetwork.value = false;
    }
  }

  return {
    isDarkMode,
    currentTab,
    selectedMonth,
    selectedWeek,
    isOnline,
    isCheckingNetwork,
    toast,
    confirmModal,
    showConfigModal,
    showShiftSettingsModal,
    showNotificationModal,
    showChangePasswordModal,
    showMobileMoreSheet,
    applyTheme,
    toggleTheme,
    showToast,
    openConfirm,
    closeConfirm,
    executeConfirm,
    initNetworkListeners,
    checkNetworkStatus
  };
});
