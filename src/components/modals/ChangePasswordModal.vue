<template>
  <Transition name="modal">
    <div
      v-if="ui.showChangePasswordModal"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
      @click.self="ui.showChangePasswordModal = false"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Đổi mật khẩu Quản trị viên</h3>
            <p class="text-xs text-slate-500 mt-0.5">Mật khẩu mới được mã hóa PBKDF2-SHA256 trước khi lưu.</p>
          </div>
          <button type="button" @click="ui.showChangePasswordModal = false" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu hiện tại <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model="currentPwd"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu mới (tối thiểu 8 ký tự) <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model="newPwd"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nhập lại mật khẩu mới <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model="confirmPwd"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
            <p v-if="confirmPwd && newPwd !== confirmPwd" class="text-[11px] text-[#c8102e] mt-1">
              Mật khẩu xác nhận không khớp.
            </p>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="ui.showChangePasswordModal = false"
              class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || newPwd.length < 8 || newPwd !== confirmPwd"
              class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer disabled:opacity-50"
            >
              {{ isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { useUiStore } from '../../stores/ui.js';
import { useAuthStore } from '../../stores/auth.js';

const ui = useUiStore();
const auth = useAuthStore();

const currentPwd = ref('');
const newPwd = ref('');
const confirmPwd = ref('');
const isSubmitting = ref(false);

watch(() => ui.showChangePasswordModal, (open) => {
  if (open) {
    currentPwd.value = '';
    newPwd.value = '';
    confirmPwd.value = '';
  }
});

async function handleSubmit() {
  if (newPwd.value !== confirmPwd.value) return;
  isSubmitting.value = true;
  try {
    const ok = await auth.changeAdminPassword(currentPwd.value, newPwd.value);
    if (ok) ui.showChangePasswordModal = false;
  } finally {
    isSubmitting.value = false;
  }
}
</script>
