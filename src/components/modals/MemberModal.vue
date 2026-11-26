<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
      @click.self="$emit('close')"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 my-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            {{ editingMember ? 'Chỉnh sửa thông tin thành viên' : 'Thêm thành viên mới' }}
          </h3>
          <button type="button" @click="$emit('close')" class="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSave" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              MSSV <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model="form.id"
              :disabled="Boolean(editingMember)"
              type="text"
              maxlength="8"
              required
              placeholder="VD: C2300023"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-mono font-semibold uppercase text-slate-900 dark:text-white focus:outline-none focus:border-brand-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Họ và tên <span class="text-[#c8102e]">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="VD: Nguyễn Văn An"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-semibold text-slate-700 dark:text-slate-300">
                Ban hoạt động <span class="text-[#c8102e]">*</span>
              </label>
              <button
                type="button"
                @click="showAddDept = !showAddDept"
                class="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                {{ showAddDept ? 'Ẩn' : '+ Thêm Ban mới' }}
              </button>
            </div>

            <div v-if="showAddDept" class="mb-2 flex gap-1.5">
              <input
                v-model="newDept"
                type="text"
                placeholder="Nhập tên Ban mới..."
                class="flex-1 px-2.5 py-1.5 rounded-lg border border-brand-300 dark:border-brand-700 bg-brand-50/40 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                @click="handleAddDept"
                class="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold cursor-pointer"
              >
                Lưu
              </button>
            </div>

            <select
              v-model="form.department"
              required
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            >
              <option value="" disabled>-- Chọn Ban --</option>
              <option v-for="d in data.departments" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Vai trò</label>
              <select
                v-model="form.role"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-600"
              >
                <option value="member">Thành viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chỉ tiêu ca/tháng</label>
              <input
                v-model.number="form.targetShifts"
                type="number"
                min="1"
                max="60"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-brand-600"
              />
            </div>
          </div>

          <!-- Optional Admin Password (PBKDF2 hashed) -->
          <div v-if="form.role === 'admin'" class="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-1.5">
            <label class="block font-semibold text-amber-900 dark:text-amber-300">
              Đặt / đổi mật khẩu quản trị (tùy chọn)
            </label>
            <input
              v-model="form.newAdminPassword"
              type="password"
              minlength="8"
              placeholder="Để trống nếu giữ nguyên mật khẩu hiện tại (tối thiểu 8 ký tự)"
              class="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
            <p class="text-[11px] text-amber-800 dark:text-amber-400">
              Mật khẩu sẽ được băm bằng PBKDF2-SHA256 trước khi lưu lên Cloud.
            </p>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày sinh</label>
            <input
              v-model="form.dob"
              type="date"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
            />
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
            >
              Lưu thông tin
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
import { useDataStore } from '../../stores/data.js';

const props = defineProps({
  show: Boolean,
  editingMember: { type: Object, default: null }
});
const emit = defineEmits(['close']);

const data = useDataStore();

const form = ref({
  id: '',
  name: '',
  department: '',
  dob: '',
  role: 'member',
  targetShifts: 10,
  newAdminPassword: ''
});

const showAddDept = ref(false);
const newDept = ref('');

watch(
  () => [props.show, props.editingMember],
  ([isOpen, m]) => {
    if (!isOpen) return;
    showAddDept.value = false;
    newDept.value = '';
    if (m) {
      form.value = {
        id: m.id,
        name: m.name,
        department: m.department || data.departments[0] || '',
        dob: m.dob || '',
        role: m.role || 'member',
        targetShifts: Number(m.targetShifts) || 10,
        newAdminPassword: ''
      };
    } else {
      form.value = {
        id: '',
        name: '',
        department: data.departments[0] || 'Ban Hành chính',
        dob: '',
        role: 'member',
        targetShifts: 10,
        newAdminPassword: ''
      };
    }
  }
);

async function handleAddDept() {
  if (!newDept.value.trim()) return;
  await data.addDepartment(newDept.value.trim());
  form.value.department = newDept.value.trim();
  newDept.value = '';
  showAddDept.value = false;
}

async function handleSave() {
  const ok = await data.saveMember({ ...form.value });
  if (ok) emit('close');
}
</script>
