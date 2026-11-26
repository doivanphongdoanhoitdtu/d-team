# GEMINI.md — Hướng Dẫn Ngữ Cảnh Dự Án (D-Team v2.0)

Tài liệu ngữ cảnh kiến trúc và quy ước mã nguồn cho **Hệ thống Quản lý Điện tử — Đội Văn Phòng Đoàn - Hội TDTU**.

---

## 1. Tổng Quan Kiến Trúc (v2.0)

- **Framework**: Vue 3 (`^3.4.0`, `<script setup>`) + **Pinia** (`src/stores/*`) quản lý trạng thái theo domain.
- **Build & Styling**: Vite (`^6.2.0`, `base: './'`) + **Tailwind CSS v4** (`@tailwindcss/vite`, `@custom-variant dark`) + **Lucide Icons** (`lucide-vue-next`). Không dùng CDN cho Vue, Tailwind, Firebase, Chart.js hay XLSX.
- **Backend / Database**: Firebase Cloud Firestore (`sctdt-a6bf9`, gói Spark miễn phí) qua npm `firebase` (`src/services/firebase.js`) với `persistentLocalCache` + `persistentMultipleTabManager` và Anonymous Auth.
- **Thiết kế giao diện**: Phong cách **Classic Đoàn - Hội Blue** (`#0052A5` primary, `#C8102E` TDTU red accent, phẳng, nghiêm túc, không gradient/glow/emoji rườm rà).

---

## 2. Cấu Trúc Thư Mục

- `src/services/`:
  - `firebase.js`: Khởi tạo Firebase SDK v12, IndexedDB offline cache, đổi cấu hình động.
  - `security.js`: Băm mật khẩu PBKDF2-SHA256, ký xác thực phiên (TTL + anti-tampering), rate limiting, sanitize Excel formula injection.
- `src/stores/`:
  - `ui.js`: Theme sáng/tối, toast, confirm modal, tab hiện tại, bộ lọc tháng/tuần, trạng thái mạng.
  - `auth.js`: Đăng nhập Thành viên (chỉ MSSV), đăng nhập Admin (PBKDF2 + tự động migrate từ tài khoản cũ + `sessions/{uid}`), đổi mật khẩu Admin.
  - `data.js`: Listener Firestore tối ưu quota (cửa sổ từ ngày 01 tháng trước), sửa đồng bộ `leave_requests` cả `shiftDate` lẫn `date`, lazy-load ảnh minh chứng từ `activity_proofs` (tương thích ngược `proofImage` cũ), `writeBatch` khi nhập/xóa hàng loạt.
- `src/utils/`:
  - `date.js`: Ngày giờ địa phương & chuẩn chia 4 tuần báo cáo thống nhất (`1–8`, `9–18`, `19–25`, `26–cuối`).
  - `normalizers.js`: Chuẩn hóa dữ liệu Firestore tương thích ngược 100% với dữ liệu cũ.
  - `imageCompress.js`: Nén ảnh thẻ SV phía client (~60–140KB).
  - `exporters.js` + `fileExport.js`: Xuất báo cáo Excel (lazy `import('xlsx')`).
  - `notifications.js`: Nhắc ca trực trong phiên qua Web Notification / Service Worker (`./sw.js`).
- `src/components/`:
  - `auth/`: `LoginGatekeeper.vue`
  - `common/`: `AppSidebar.vue`, `AppTopBar.vue`, `MobileBottomNav.vue`, `NetworkStatusBanner.vue`, `Toast.vue`
  - `activities/`: `AdminActivityManager.vue`, `UserActivityPortal.vue`
  - `tabs/`: `TabDashboard.vue`, `TabLeaveRequests.vue`, `TabMembersList.vue`, `TabMyRegisteredShifts.vue`, `TabShiftEntry.vue`, `TabShiftHistory.vue`, `TabShiftRegister.vue`
  - `modals/`: `ActivityDetailModal.vue`, `BatchImportModal.vue`, `ChangePasswordModal.vue`, `ConfigModal.vue`, `ConfirmDeleteModal.vue`, `LeaveActivityModal.vue`, `MemberModal.vue`, `NotificationModal.vue`, `ShiftSettingsModal.vue`
- `firestore.rules` & `SECURITY.md`: Quy tắc bảo mật Firestore và hướng dẫn triển khai.

---

## 3. Lệnh Phát Triển & Kiểm Thử

- Cài đặt: `npm install`
- Chạy dev (port 3000): `npm run dev`
- Chạy unit test (Vitest): `npm test`
- Build production: `npm run build`
