<template>
  <div class="min-h-screen flex flex-col bg-[#F4F6F9] dark:bg-[#0B1220]">
    <!-- Top Institutional Strip -->
    <div class="h-1.5 bg-brand-600 w-full"></div>

    <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <!-- Brand Header -->
        <div class="px-6 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1.5 mb-3">
            <img :src="logoUrl" alt="Logo Đội Văn Phòng Đoàn - Hội TDTU" class="w-full h-full object-contain rounded-lg" />
          </div>
          <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Đoàn Thanh niên — Hội Sinh viên TDTU
          </p>
          <h1 class="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            Hệ thống Quản lý Đội Văn Phòng
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý lịch trực, điểm danh hoạt động và chỉ tiêu thành viên
          </p>
        </div>

        <div class="p-6 space-y-5">
          <!-- Role Switcher -->
          <div class="grid grid-cols-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              @click="role = 'member'"
              class="py-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              :class="role === 'member'
                ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <User class="w-3.5 h-3.5" />
              <span>Thành viên</span>
            </button>
            <button
              type="button"
              @click="role = 'admin'"
              class="py-2 rounded-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              :class="role === 'admin'
                ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <ShieldCheck class="w-3.5 h-3.5" />
              <span>Quản trị viên</span>
            </button>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label for="login-mssv" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mã số sinh viên (MSSV) <span class="text-[#c8102e]">*</span>
              </label>
              <input
                id="login-mssv"
                v-model="memberId"
                type="text"
                required
                maxlength="8"
                autocomplete="username"
                placeholder="Ví dụ: C2300023"
                class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono font-semibold uppercase tracking-wide text-slate-900 dark:text-white placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
              />
              <p v-if="role === 'member'" class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Thành viên đăng nhập trực tiếp bằng MSSV có trong danh sách Đội.
              </p>
            </div>

            <div v-if="role === 'admin'">
              <label for="login-password" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu quản trị <span class="text-[#c8102e]">*</span>
              </label>
              <div class="relative">
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  placeholder="Nhập mật khẩu quản trị"
                  class="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
                >
                  <EyeOff v-if="showPassword" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              :disabled="auth.isAuthenticating"
              class="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="auth.isAuthenticating" class="w-4 h-4 animate-spin" />
              <LogIn v-else class="w-4 h-4" />
              <span>{{ auth.isAuthenticating ? 'Đang xác thực...' : (role === 'admin' ? 'Đăng nhập Quản trị' : 'Đăng nhập Thành viên') }}</span>
            </button>
          </form>

          <!-- Connection status footer -->
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div class="flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full"
                :class="data.isCloudConnected ? 'bg-emerald-600' : 'bg-amber-500'"
              ></span>
              <span>{{ data.isCloudConnected ? 'Đã kết nối dữ liệu Cloud' : 'Đang kết nối dữ liệu...' }}</span>
            </div>
            <button
              v-if="!data.isCloudConnected"
              type="button"
              @click="data.initCloud(true)"
              class="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    </div>

    <footer class="py-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
      Đội Văn Phòng Đoàn - Hội Trường Đại học Tôn Đức Thắng
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { User, ShieldCheck, LogIn, Eye, EyeOff, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '../../stores/auth.js';
import { useDataStore } from '../../stores/data.js';

const auth = useAuthStore();
const data = useDataStore();

const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`;
const role = ref('member');
const memberId = ref('');
const password = ref('');
const showPassword = ref(false);

async function handleSubmit() {
  const ok = await auth.login({
    role: role.value,
    memberId: memberId.value,
    password: password.value
  });
  if (ok) {
    password.value = '';
  }
}
</script>
