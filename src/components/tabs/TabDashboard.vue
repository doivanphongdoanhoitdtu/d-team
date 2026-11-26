<template>
  <div class="space-y-5">
    <!-- KPI Strip -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tổng ca trực đã ghi</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {{ periodShifts.length }} <span class="text-xs font-normal text-slate-400">ca</span>
          </p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
          <ClipboardCheck class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ca đã đăng ký</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {{ periodRegs.length }} <span class="text-xs font-normal text-slate-400">ca</span>
          </p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 flex items-center justify-center">
          <CalendarDays class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tỷ lệ hoàn thành chỉ tiêu</p>
          <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">{{ targetPassRate }}%</p>
          <p class="text-[11px] text-slate-500 tabular-nums mt-0.5">{{ passingMembersCount }}/{{ data.members.length }} thành viên đạt</p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
          <TrendingUp class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Đơn xin nghỉ phép</p>
          <p class="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-1">
            {{ data.leaveRequests.length }} <span class="text-xs font-normal text-slate-400">đơn</span>
          </p>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
          <FileText class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Top thành viên trực nhiều nhất</h3>
        <div class="relative h-64">
          <canvas ref="barCanvas"></canvas>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Phân bổ ca trực theo khung giờ</h3>
        <div class="relative h-64">
          <canvas ref="doughnutCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Unified 4-Week Evaluation Matrix (Consistent with Global Reporting Periods) -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            Ma trận đánh giá chỉ tiêu theo tuần — Tháng {{ ui.selectedMonth }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Chuẩn 4 kỳ báo cáo: Tuần 1 (1–8), Tuần 2 (9–18), Tuần 3 (19–25), Tuần 4 (26–Cuối tháng) · Định mức 10 ca/tháng.
          </p>
        </div>

        <div class="relative sm:w-64">
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="matrixSearch"
            type="text"
            placeholder="Tìm thành viên, MSSV, Ban..."
            class="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-600"
          />
        </div>
      </div>

      <div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="py-2.5 px-4 font-semibold">Thành viên</th>
              <th v-for="w in REPORTING_WEEKS" :key="w.id" class="py-2.5 px-3 text-center font-semibold">
                <div>{{ w.label }}</div>
                <div class="text-[10px] font-normal text-slate-400">{{ w.range }}</div>
              </th>
              <th class="py-2.5 px-3 text-center font-semibold">Tổng tháng</th>
              <th class="py-2.5 px-4 text-center font-semibold">Đánh giá</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-if="filteredMatrix.length === 0">
              <td colspan="7" class="py-8 text-center text-slate-400">Không tìm thấy thành viên phù hợp.</td>
            </tr>
            <tr
              v-for="row in filteredMatrix"
              :key="row.member.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              <td class="py-2.5 px-4">
                <div class="font-semibold text-slate-900 dark:text-white">{{ row.member.name }}</div>
                <div class="text-[11px] text-slate-500 font-mono">
                  {{ row.member.id }} <span v-if="row.member.department" class="font-sans">· {{ row.member.department }}</span>
                </div>
              </td>
              <td v-for="w in [1, 2, 3, 4]" :key="w" class="py-2.5 px-3 text-center tabular-nums">
                <span
                  v-if="row.weeks[w] >= 2"
                  class="inline-flex px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold"
                >
                  {{ row.weeks[w] }}
                </span>
                <span
                  v-else-if="row.weeks[w] === 1"
                  class="inline-flex px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold"
                >
                  1
                </span>
                <span v-else class="text-slate-300 dark:text-slate-600">0</span>
              </td>
              <td class="py-2.5 px-3 text-center tabular-nums">
                <span class="font-bold text-slate-900 dark:text-white">{{ row.total }}</span>
                <span class="text-slate-400"> / {{ row.target }}</span>
              </td>
              <td class="py-2.5 px-4 text-center">
                <span
                  class="inline-flex px-2 py-0.5 rounded border text-[11px] font-semibold"
                  :class="row.isPassed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-red-50 text-[#c8102e] border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'"
                >
                  {{ row.isPassed ? 'Đạt chỉ tiêu' : 'Chưa đạt' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import { ClipboardCheck, CalendarDays, TrendingUp, FileText, Search } from 'lucide-vue-next';
import { useDataStore } from '../../stores/data.js';
import { useUiStore } from '../../stores/ui.js';
import { REPORTING_WEEKS, getWeekNumFromDate, isDateInSelectedMonth } from '../../utils/date.js';

const data = useDataStore();
const ui = useUiStore();

const barCanvas = ref(null);
const doughnutCanvas = ref(null);
const matrixSearch = ref('');

let barChart = null;
let doughnutChart = null;

const periodShifts = computed(() =>
  data.getShiftsForPeriod(ui.selectedMonth, ui.selectedWeek, 'admin')
);
const periodRegs = computed(() =>
  data.getRegistrationsForPeriod(ui.selectedMonth, ui.selectedWeek)
);

// Matrix always evaluates full selected month across 4 reporting weeks
const monthShifts = computed(() =>
  data.shifts.filter((s) => isDateInSelectedMonth(s.date, ui.selectedMonth))
);

const matrixRows = computed(() => {
  const byMember = new Map();
  for (const s of monthShifts.value) {
    if (!byMember.has(s.memberId)) byMember.set(s.memberId, []);
    byMember.get(s.memberId).push(s);
  }

  return data.members.map((member) => {
    const list = byMember.get(member.id) || [];
    const weeks = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const s of list) {
      const w = getWeekNumFromDate(s.date);
      weeks[w] = (weeks[w] || 0) + 1;
    }
    const total = list.length;
    const target = Number(member.targetShifts) || 10;
    return { member, weeks, total, target, isPassed: total >= target };
  });
});

const passingMembersCount = computed(() => matrixRows.value.filter((r) => r.isPassed).length);

const targetPassRate = computed(() => {
  if (data.members.length === 0) return 0;
  const totalTarget = data.members.reduce((acc, m) => acc + (Number(m.targetShifts) || 10), 0);
  if (totalTarget === 0) return 0;
  return Math.min(100, Math.round((monthShifts.value.length / totalTarget) * 100));
});

const filteredMatrix = computed(() => {
  const q = matrixSearch.value.trim().toLowerCase();
  if (!q) return matrixRows.value;
  return matrixRows.value.filter(
    (r) =>
      r.member.name.toLowerCase().includes(q) ||
      r.member.id.toLowerCase().includes(q) ||
      (r.member.department || '').toLowerCase().includes(q)
  );
});

function destroyCharts() {
  if (barChart) { barChart.destroy(); barChart = null; }
  if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
}

function renderCharts() {
  nextTick(() => {
    const isDark = ui.isDarkMode;
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#1e293b' : '#f1f5f9';

    if (barCanvas.value) {
      if (barChart) barChart.destroy();

      const counts = new Map();
      for (const s of periodShifts.value) {
        counts.set(s.memberId, (counts.get(s.memberId) || 0) + 1);
      }

      const top = data.members
        .map((m) => ({
          name: m.name,
          completed: counts.get(m.id) || 0,
          target: Number(m.targetShifts) || 10
        }))
        .filter((x) => x.completed > 0)
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 7);

      barChart = new Chart(barCanvas.value, {
        type: 'bar',
        data: {
          labels: top.map((t) => t.name),
          datasets: [
            {
              label: 'Ca đã trực',
              data: top.map((t) => t.completed),
              backgroundColor: '#0052A5',
              borderRadius: 4,
              barPercentage: 0.55
            },
            {
              label: 'Chỉ tiêu tháng',
              data: top.map((t) => t.target),
              backgroundColor: isDark ? '#334155' : '#cbd5e1',
              borderRadius: 4,
              barPercentage: 0.55
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { size: 11, weight: '600' } } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
            y: { beginAtZero: true, ticks: { precision: 0, color: textColor }, grid: { color: gridColor } }
          }
        }
      });
    }

    if (doughnutCanvas.value) {
      if (doughnutChart) doughnutChart.destroy();

      const palette = ['#0052A5', '#15803D', '#D97706', '#0284C7', '#64748B', '#C8102E'];
      const types = data.shiftTypeNames.length ? data.shiftTypeNames : ['Ca 1', 'Ca 2', 'Ca 3', 'Ca 4'];
      const values = types.map((t) => periodShifts.value.filter((s) => s.shiftType === t).length);
      const total = values.reduce((a, b) => a + b, 0);

      doughnutChart = new Chart(doughnutCanvas.value, {
        type: 'doughnut',
        data: {
          labels: types,
          datasets: [
            {
              data: total > 0 ? values : types.map((_, i) => (i === 0 ? 1 : 0)),
              backgroundColor: types.map((_, i) => palette[i % palette.length]),
              borderColor: isDark ? '#0f172a' : '#ffffff',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '64%',
          plugins: {
            legend: { position: 'right', labels: { color: textColor, font: { size: 11, weight: '600' } } },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${total > 0 ? values[ctx.dataIndex] : 0} ca`
              }
            }
          }
        }
      });
    }
  });
}

onMounted(renderCharts);
onBeforeUnmount(destroyCharts);

watch(
  () => [periodShifts.value, data.members.length, ui.isDarkMode, ui.selectedMonth],
  renderCharts
);
</script>
