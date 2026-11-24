# 🚀 Hướng Dẫn Triển Khai Hệ Thống HSKMaster AI Lên Mạng (Production Deployment)

Tài liệu này cung cấp toàn bộ các phương án đưa nền tảng **HSKMaster AI** lên mạng Internet có đường dẫn HTTPS công khai cho học sinh và giáo viên sử dụng trên mọi thiết bị (máy tính, điện thoại, máy tính bảng).

---

## 🌐 1. Link Trực Tuyến Công Khai Tức Thì (Instant Public URLs)

Hệ thống hiện đang được mở mạng trực tuyến công khai và đang hoạt động:

### 🌟 Link Chính Thức (Khuyên Dùng - Tốc độ cao, không cần nhập mã):
* **Đường dẫn Cloudflare**: **[https://craps-speaking-comic-achieve.trycloudflare.com](https://craps-speaking-comic-achieve.trycloudflare.com)**
  * **Trạng thái**: 🟢 Đang hoạt động (Active)
  * **Đặc điểm**: Tự động mã hóa HTTPS, mạng CDN toàn cầu siêu tốc của Cloudflare, truy cập trực tiếp ngay lập tức không có trang xác nhận trung gian.

### 🔗 Link Dự Phòng (Localtunnel):
* **Đường dẫn Localtunnel**: **[https://eleven-pets-give.loca.lt](https://eleven-pets-give.loca.lt)**
  * **Mật khẩu IP Tunnel (Click to Continue)**: `116.107.128.169`
  * *(Nếu màn hình yêu cầu "Endpoint IP", dán IP trên rồi bấm "Click to Submit" là vào thẳng web)*.

---

## 🔑 2. Tài Khoản & Kiểm Tra Truy Cập

| Loại tài khoản | Tên đăng nhập | Mật khẩu | Quyền hạn & Chức năng |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin` | `admin123` | Toàn quyền quản trị, đồng bộ Google Sheets, quản lý tài khoản, nhập đề AI |
| **Giáo viên (Teacher)** | `teacher_lan` | `lan123` | Quản lý học tập, xem kết quả thi và đề luyện |
| **Học sinh (Student)** | `hs_minh` | `minh123` | Học từ vựng, ngữ pháp, luyện 4 kỹ năng Nghe/Nói/Đọc/Viết, thi HSK 1-6 |
| **Học sinh (Student)** | `hs_an` | `an123` | Luyện thi HSK, tương tác AI Tutor |

---

## ☁️ 3. Triển Khai Vĩnh Viễn Lên Nền Tảng Đám Mây (Cloud Deployment)

Dự án đã được cấu hình sẵn các tệp tự động hóa triển khai:
* `render.yaml` (Dành cho Render.com Blueprint)
* `railway.json` & `Dockerfile` (Dành cho Railway.app)
* `fly.toml` (Dành cho Fly.io)
* `docker-compose.yml` (Dành cho VPS riêng)

### Phương án A: Triển khai 1-click lên Render.com (Miễn phí)
1. Đẩy mã nguồn dự án lên GitHub.
2. Đăng nhập [https://render.com](https://render.com) bằng GitHub.
3. Chọn **New +** -> **Blueprint** -> Chọn repository vừa tạo.
4. Render sẽ tự động đọc file `render.yaml` trong repo và cấu hình:
   * **Build Command**: `npm --prefix client install && npm --prefix client run build && npm --prefix server install --omit=dev`
   * **Start Command**: `node server/server.js`
   * **Auto SSL**: Tự động cấp HTTPS miễn phí vĩnh viễn dạng `https://hskmaster-ai.onrender.com`.

### Phương án B: Triển khai lên Railway.app
1. Truy cập [https://railway.app](https://railway.app) -> **New Project** -> **Deploy from GitHub repo**.
2. Railway tự động phát hiện `Dockerfile` và `railway.json` để build và chạy ứng dụng.
3. Vào tab **Settings** -> **Networking** -> Bấm **Generate Domain**.

### Phương án C: Triển khai lên Fly.io
1. Cài đặt Fly CLI: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
2. Chạy lệnh:
   ```bash
   fly launch
   fly deploy
   ```
3. Ứng dụng tự động triển khai tại cụm máy chủ Singapore (`sin`) với độ trễ thấp nhất.

### Phương án D: Triển khai lên máy chủ VPS riêng (Ubuntu / Debian / CentOS)
1. Cài đặt Docker và Docker Compose trên VPS.
2. Clone mã nguồn vào VPS.
3. Chạy lệnh khởi động daemon:
   ```bash
   docker compose up -d --build
   ```
4. Kiểm tra trạng thái: `docker compose ps` hoặc `curl http://localhost:5000/api/health`.

---

## 🛠️ 4. Cách Tự Mở Tunnel Bằng Lệnh Trong Tương Lai

Nếu bạn muốn mở đường hầm trực tuyến từ máy tính của mình bất cứ lúc nào:
```bash
# Sử dụng Cloudflare Tunnel (Khuyên dùng - không cần đăng ký tài khoản)
npx cloudflared tunnel --url http://localhost:5000

# Hoặc sử dụng Localtunnel
npx localtunnel --port 5000
```
