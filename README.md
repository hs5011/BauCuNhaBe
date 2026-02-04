
# 🗳️ Hệ Thống Quản Lý Bầu Cử 2026

Hệ thống quản lý cử tri, xác nhận danh tính và thống kê tình hình bỏ phiếu thời gian thực dành cho Ủy Ban Bầu cử Đại biểu Quốc hội khóa XIV và Đại biểu Hội đồng nhân dân các cấp Xã Nhà bè.

## ✨ Tính năng chính

- **Quản lý cán bộ**: Admin có thể thêm/xóa/sửa tài khoản và phân quyền theo khu vực.
- **Nhập liệu thông minh**: Hỗ trợ nhập danh sách hàng ngàn cử tri từ tệp Excel (.xlsx).
- **Dashboard thời gian thực**: Thống kê tỷ lệ đi bầu theo Khu phố, Tổ và Đơn vị bầu cử.
- **Xác nhận cử tri (Check-in)**: Tra cứu nhanh bằng CCCD, hiển thị thông tin chi tiết và đánh dấu đã bầu cử.
- **Phân quyền chặt chẽ**: Cán bộ chỉ xem và xác nhận cử tri trong phạm vi khu vực được phân công.

## 🚀 Hướng dẫn khởi chạy

**Chạy local (dev):**
```bash
npm install
npm run dev
```
Mở http://localhost:3000

**Build production:**
```bash
npm run build
```
Thư mục `dist/` sẽ chứa file tĩnh để deploy.

## 🌐 Đưa lên GitHub và bật GitHub Pages (public)

1. **Tạo repository mới trên GitHub**
   - Vào https://github.com/new
   - Đặt tên repo (ví dụ: `BauCuNhaBe` hoặc `he-thong-bau-cu-2026`)
   - Không chọn "Add a README" (đã có sẵn trong project)
   - Tạo repo (Create repository)

2. **Đẩy code lên GitHub** (chạy trong thư mục project):
   ```bash
   git remote add origin https://github.com/TEN-DANG-NHAP-GITHUB/TEN-REPO.git
   git push -u origin main
   ```
   Thay `TEN-DANG-NHAP-GITHUB` và `TEN-REPO` bằng tên tài khoản và tên repo của bạn.

3. **Bật GitHub Pages**
   - Vào repo trên GitHub → **Settings** → **Pages**
   - Ở **Build and deployment** chọn **Source**: **GitHub Actions**
   - Mỗi lần push lên nhánh `main`, workflow sẽ tự build và deploy. Trang public sẽ có dạng:
   - `https://TEN-DANG-NHAP-GITHUB.github.io/TEN-REPO/`

## 🛠️ Công nghệ sử dụng

- **React 19**: Thư viện UI chính.
- **Tailwind CSS**: Framework thiết kế giao diện nhanh.
- **Lucide React**: Bộ icon chuyên nghiệp.
- **Recharts**: Biểu đồ thống kê trực quan.
- **SheetJS (XLSX)**: Xử lý tệp tin Excel.
- **Google Sheet**: Lưu toàn bộ dữ liệu (cử tri, cán bộ, khu vực, cấu hình) trên một file Google Sheet (tùy chọn; nếu chưa cấu hình thì dùng Local Storage).

## 📊 Lưu dữ liệu lên Google Sheet (1 file)

Toàn bộ dữ liệu có thể lưu trên **một file Google Sheet** thay vì chỉ lưu trên trình duyệt.

1. **Tạo file Google Sheet**
   - Vào [Google Drive](https://drive.google.com) → Tạo → Google Sheets → Trống.
   - Đặt tên file (VD: "BauCuNhaBe Data").

2. **Gắn mã Apps Script**
   - Trong file Sheet: **Tiện ích (Extensions)** → **Apps Script**.
   - Xóa code mặc định, mở file `docs/GoogleAppsScript_Code.js` trong project, copy toàn bộ nội dung và dán vào trình soạn thảo Apps Script.
   - **Lưu** (Ctrl+S).

3. **Deploy Web App**
   - Trong Apps Script: **Triển khai (Deploy)** → **Triển khai mới** → **Chọn loại**: **Ứng dụng web**.
   - **Thực thi với tài khoản**: Tôi (email của bạn).
   - **Quyền truy cập**: chọn **Bất kỳ ai** (nếu chọn "Chỉ mình tôi" sẽ bị lỗi 403 khi gọi từ app/localhost).
   - Bấm **Triển khai**, authorize nếu được hỏi, rồi **sao chép URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
   - **Nếu đã deploy trước đó mà gặp lỗi 403**: Vào **Triển khai** → **Quản lý triển khai** → biểu tượng **chỉnh sửa** (bút chì) → đổi **Quyền truy cập** thành **Bất kỳ ai** → **Phiên bản**: **Mới phiên bản** → **Triển khai**.

4. **Nhập URL vào app**
   - Đăng nhập app → **Cài đặt** (Settings) → mục **Kết nối Google Sheet** → dán URL vừa copy → **Lưu URL**.

Sau đó mọi thao tác (thêm/sửa cử tri, cán bộ, khu vực, thời gian kết thúc) sẽ được lưu lên file Google Sheet. Một file Sheet sẽ có 4 sheet con: **Users**, **Voters**, **VotingAreas**, **ElectionSettings**.

## 🗄️ Chuyển backend sang Supabase (khuyến nghị)

Google Sheet/Proxy công cộng có thể chậm và hay timeout. Supabase (Postgres) sẽ nhanh và ổn định hơn khi public.

### 1) Tạo project Supabase
- Vào Supabase → tạo project mới.
- Vào **Project Settings → API** copy:
  - **Project URL**
  - **anon public key**

### 2) Tạo bảng
- Vào **SQL Editor** và chạy file `docs/supabase_schema.sql`.

> Lưu ý: file SQL có ghi chú về RLS. Để chạy demo nhanh, bạn có thể tạm tắt RLS. Khi cần bảo mật thật, hãy bật RLS và dùng Supabase Auth + policy.

### 3) Cấu hình biến môi trường
- Tạo file `.env` tại thư mục project (cùng cấp `package.json`) theo `.env.example`:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### 4) Chạy lại app

```bash
npm run dev
```

Khi đã có `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`, app sẽ tự dùng Supabase để lưu:
- `users`
- `voters` (import Excel sẽ insert theo lô)
- `voting_areas`
- `election_settings` (key: `election_end_time`)

---
© 2026 Ủy Ban Bầu cử Đại biểu Quốc hội khóa XIV và Đại biểu Hội đồng nhân dân các cấp Xã Nhà bè.
