# Hướng Dẫn Bảo Mật & Vận Hành (v2.0)

## 1. Các nâng cấp bảo mật đã triển khai

1. **Loại bỏ hoàn toàn mật khẩu plain-text & công thức lộ trên client**:
   - Không còn lưu/đọc toàn bộ danh sách `admin_accounts` về trình duyệt người dùng.
   - Mật khẩu Quản trị viên sử dụng **PBKDF2-SHA256 (100.000 vòng lặp + muối ngẫu nhiên 16 byte)** qua Web Crypto API (`src/services/security.js`).
   - **Tự động nâng cấp không gián đoạn**: Khi Quản trị viên đăng nhập lần đầu từ dữ liệu cũ, hệ thống tự động mã hóa lại mật khẩu sang PBKDF2-SHA256 và xóa trường `password` dạng văn bản thô trên Firestore.
   - Chức năng **Đổi mật khẩu quản trị** tích hợp sẵn trong thanh điều hướng Admin.
2. **Bảo vệ phiên đăng nhập (Anti-Tampering Session)**:
   - Phiên đăng nhập được ký xác thực (HMAC-SHA256 + thời hạn TTL: 12 giờ cho Admin, 14 ngày cho Thành viên).
   - Phiên Admin đồng thời ghi nhận trên collection `sessions/{firebaseAuthUid}` gắn với Firebase Auth UID; việc sửa tay `localStorage` qua DevTools sẽ bị từ chối khi kiểm tra lại.
3. **Chống dò mật khẩu (Rate Limiting)**:
   - Nhập sai mật khẩu Quản trị viên 5 lần liên tiếp sẽ tự động khóa tạm thời tăng dần (30 giây → 2 phút → 5 phút).
4. **Chống Excel Formula Injection**:
   - Mọi ô văn bản xuất ra `.xlsx` đều được lọc ký tự công thức đầu dòng (`=`, `+`, `-`, `@`).
5. **Tối ưu & tách kho ảnh minh chứng (Spark Free Tier)**:
   - Ảnh điểm danh được nén xuống tối đa 1024px (~60–140 KB) và lưu tách tại collection `activity_proofs/{checkinId}` (chỉ tải khi Admin bấm "Xem minh chứng"), đồng thời vẫn hiển thị đầy đủ ảnh cũ lưu trong `activity_checkins`.

## 2. Triển khai Firestore Security Rules

Để bật bảo vệ ở phía máy chủ Firestore:
1. Mở [Firebase Console](https://console.firebase.google.com/) → chọn dự án `sctdt-a6bf9`.
2. Vào **Authentication → Sign-in method** → đảm bảo đã bật **Anonymous** (để mỗi phiên trình duyệt có `request.auth.uid`).
3. Vào **Firestore Database → Rules** → sao chép toàn bộ nội dung tệp `firestore.rules` ở thư mục gốc dự án và bấm **Publish**.
