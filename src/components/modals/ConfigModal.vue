<template>
  <Transition name="modal">
    <div
      v-if="ui.showConfigModal"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
      @click.self="ui.showConfigModal = false"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4 my-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Cấu hình hệ thống</h3>
            <p class="text-xs text-slate-500 mt-0.5">Thiết lập kết nối Firebase Firestore và sao lưu Google Drive.</p>
          </div>
          <button type="button" @click="ui.showConfigModal = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <div class="space-y-1.5">
            <label class="block font-semibold text-slate-700 dark:text-slate-300">
              1. Cấu hình Firebase Firestore (JSON)
            </label>
            <textarea
              v-model="configText"
              rows="5"
              class="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-600"
            ></textarea>
          </div>

          <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label class="block font-semibold text-slate-700 dark:text-slate-300">
              2. Google Apps Script Web App URL (Sao lưu ảnh Drive)
            </label>
            <input
              v-model="driveUrl"
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-600"
            />
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <span class="font-semibold text-slate-700 dark:text-slate-300">3. Kiểm tra thông báo trình duyệt</span>
            <button
              type="button"
              @click="testNotification"
              class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
            >
              Gửi thông báo thử
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            @click="handleReset"
            class="text-[#c8102e] dark:text-red-400 font-semibold hover:underline cursor-pointer"
          >
            Khôi phục mặc định
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              @click="ui.showConfigModal = false"
              class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              @click="handleSave"
              class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
            >
              Lưu &amp; kết nối lại
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';
import { useDataStore } from '../../stores/data.js';
import {
  getSavedFirebaseConfig,
  saveCustomFirebaseConfig,
  resetSavedFirebaseConfig
} from '../../services/firebase.js';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showWebNotification
} from '../../utils/notifications.js';

const ui = useUiStore();
const data = useDataStore();

const configText = ref('');
const driveUrl = ref('');

watch(() => ui.showConfigModal, (open) => {
  if (open) {
    configText.value = JSON.stringify(getSavedFirebaseConfig(), null, 2);
    driveUrl.value = localStorage.getItem('google_drive_script_url') || '';
  }
});

async function handleSave() {
  try {
    const parsed = JSON.parse(configText.value.trim());
    saveCustomFirebaseConfig(parsed);
    if (driveUrl.value.trim()) {
      localStorage.setItem('google_drive_script_url', driveUrl.value.trim());
    } else {
      localStorage.removeItem('google_drive_script_url');
    }
    ui.showConfigModal = false;
    await data.initCloud(true);
    ui.showToast('Đã lưu cấu hình và kết nối lại Cloud Firestore.', 'success');
  } catch (err) {
    ui.showToast(`Cấu hình JSON không hợp lệ: ${err.message}`, 'error');
  }
}

async function handleReset() {
  const def = resetSavedFirebaseConfig();
  configText.value = JSON.stringify(def, null, 2);
  localStorage.removeItem('google_drive_script_url');
  driveUrl.value = '';
  ui.showConfigModal = false;
  await data.initCloud(true);
  ui.showToast('Đã khôi phục cấu hình Firebase mặc định.', 'info');
}

async function testNotification() {
  let perm = getNotificationPermission();
  if (perm !== 'granted') {
    perm = await requestNotificationPermission();
  }
  if (perm === 'granted') {
    await showWebNotification('Hệ thống Quản lý ĐVP', {
      body: 'Thông báo nhắc lịch trực trên trình duyệt đang hoạt động bình thường.'
    });
    ui.showToast('Đã gửi thông báo thử.', 'success');
  } else {
    ui.showToast('Trình duyệt chưa cấp quyền hiển thị thông báo.', 'warning');
  }
}
</script>
