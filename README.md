
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
- **Local Storage**: Lưu trữ dữ liệu tạm thời (Demo).

---
© 2026 Ủy Ban Bầu cử Đại biểu Quốc hội khóa XIV và Đại biểu Hội đồng nhân dân các cấp Xã Nhà bè.
