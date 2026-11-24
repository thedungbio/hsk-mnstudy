# HSKMaster AI - Nền Tảng Học Tiếng Trung & Luyện Thi HSK Thông Minh Tích Hợp AI

> **Đầy đủ 4 kỹ năng HSK 1 - 6 • Nhập tài liệu bằng AI (Word, Excel, PDF) • Đồng bộ tài khoản Google Sheets • Phòng thi HSK thực chiến • Trợ lý AI Gia sư 24/7**

---

## 🌟 1. GIỚI THIỆU TỔNG QUAN

**HSKMaster AI** là nền tảng công nghệ giáo dục (EdTech) trực tuyến chuyên sâu cho việc giảng dạy và học tiếng Trung Quốc theo khung tiêu chuẩn **HSK 1 đến HSK 6 (chuẩn HSK mới)**. Hệ thống được xây dựng với kiến trúc Fullstack hoàn chỉnh, có Backend, Database quan hệ bền vững, API bảo mật, xác thực phân quyền 3 cấp (Admin, Giáo viên, Học sinh), công cụ AI phân tích tài liệu và đồng bộ hai chiều từ Google Sheets.

---

## 🚀 2. KHỞI CHẠY HỆ THỐNG (QUICK START)

Website đã được tích hợp trọn gói (Fullstack Single-Port), bạn chỉ cần khởi động backend là cả API và giao diện Web SPA sẽ chạy đồng thời:

```bash
# 1. Chạy server chính thức (cả API và giao diện)
npm start
```

Mở trình duyệt và truy cập:
👉 **`http://localhost:5000`**

*(Nếu muốn nạp lại dữ liệu khởi tạo mẫu HSK: `npm run seed`)*

---

## 🔑 3. TÀI KHOẢN TRẢI NGHIỆM HỆ THỐNG

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn chính |
|---------|---------------|----------|-----------------|
| **Quản Trị Viên (Admin)** | `admin` | `admin123` | Toàn quyền: Đồng bộ Google Sheets, Nhập tài liệu AI, Quản lý tài khoản, Đề thi |
| **Giáo Viên (Teacher)** | `giaovien_lan` | `teacher123` | Nhập tài liệu AI, Giám sát tiến độ học sinh, Quản lý ngân hàng câu hỏi |
| **Học Sinh (Student)** | `hocsinh_minh` | `student123` | Học từ vựng, Flashcard 3D, Luyện nghe/nói/đọc/viết, Thi thử HSK, Trợ lý AI |
| **Học Sinh 2 (Student)** | `hocsinh_mai` | `student123` | Học tập và thi thử HSK |
| **Tài khoản bị khóa** | `hocsinh_khoa` | `student123` | Dùng để kiểm thử cơ chế bảo mật (Bị chặn đăng nhập 403 Forbidden) |

*(Trên màn hình Đăng nhập có sẵn 3 nút **Quick Login** để bạn bấm đăng nhập tức thì không cần gõ phím!)*

---

## 🎯 4. CÁC TÍNH NĂNG VÀ MODULE CỐT LÕI

### 1. Hệ thống Đồng bộ Tài khoản Google Sheets (Google Sheets Sync Studio)
- Quản trị tài khoản tập trung từ Google Sheets với 3 trang tính: `admin`, `giao_vien`, `hoc_sinh`.
- Các trường dữ liệu chuẩn: `id`, `username`, `password` (tự động mã hóa Bcrypt), `full_name`, `email`, `role`, `status`.
- Hỗ trợ đồng bộ 1-click qua **Google Sheet ID** hoặc **CSV Public URL**.
- Có cơ chế **Đồng bộ dữ liệu mẫu (Demo Sync)** để trải nghiệm tức thì.
- Cập nhật trạng thái `locked` (Khóa tài khoản) có hiệu lực ngay lập tức tại Backend, ngăn học sinh bị khóa đăng nhập.
- Ghi nhật ký đồng bộ chi tiết tại bảng `sync_logs`.

### 2. Module AI Document Import System (Nhập Tài Liệu Thông Minh)
- **Định dạng hỗ trợ**: Word (`.docx`, `.doc`), Excel (`.xlsx`, `.xls`), PDF (`.pdf`), TXT, CSV.
- **Bảo mật tuyệt đối**: Từ chối và ngăn chặn ngay lập tức các tệp thực thi (`.exe`, `.bat`, `.cmd`, `.sh`, `.msi`).
- **AI NLP Engine**: Tự động nhận diện chữ Hán, phiên âm Pinyin, nghĩa tiếng Việt, phân loại cấp độ HSK 1 - 6, câu hỏi trắc nghiệm A/B/C/D, đáp án và giải thích.
- **Bảng xem trước & Chỉnh sửa (Preview & Edit)**: Admin có thể sửa đổi trực tiếp từng dòng dữ liệu trong bảng trước khi nhấn nút xác nhận nạp vào Database.
- Ngăn chặn trùng lặp từ vựng và lưu vết nguồn gốc tài liệu trong `uploaded_documents`.

### 3. Module Học Từ Vựng & Thẻ Ghi Nhớ Flashcard 3D
- Hiển thị chữ Hán cỡ lớn chuẩn font Noto Sans SC, kèm Pinyin thanh điệu chuẩn.
- Tích hợp **Web Speech API** phát âm giọng đọc bản xứ tiếng Trung (`zh-CN`).
- Chế độ **Flashcard 3D lật mặt thẻ** tương tác mượt mà.
- Tính năng đánh dấu **Từ vựng yêu thích (Star ⭐)** để ôn tập riêng.
- Bộ lọc theo cấp độ từ HSK 1 đến HSK 6.

### 4. Module Ngữ Pháp HSK (Grammar Hub)
- Công thức, cấu trúc ngữ pháp chuẩn hóa.
- Giải thích chi tiết ngữ cảnh và ví dụ song ngữ Trung - Việt kèm phát âm.
- Bài tập trắc nghiệm củng cố ngay tại chỗ với phản hồi đúng/sai và phân tích đáp án.

### 5. Module Luyện Nghe (Listening Player - 听力)
- Audio Player phát hội thoại tiếng Trung chân thực.
- Bài tập trắc nghiệm chọn đáp án theo phong cách đề thi HSK.
- Hộp Transcript song ngữ có thể ẩn/hiện để học sinh tự kiểm tra độ nghe hiểu.

### 6. Module Luyện Nói AI (Speaking Studio - 口语)
- Tích hợp Microphone và **Web Speech Recognition** nhận diện tiếng Trung `zh-CN`.
- Chuyển đổi giọng nói người học thành văn bản Hán tự theo thời gian thực.
- Thuật toán AI so khớp âm sắc và thanh điệu, chấm điểm từ 0 - 100 và đưa ra lời nhận xét phát âm.

### 7. Module Luyện Đọc (Reading Comprehension - 阅读)
- Tuyển tập đoạn văn chữ Hán theo từng cấp độ HSK.
- Công cụ bật/tắt Pinyin và bản dịch tiếng Việt linh hoạt.
- Hệ thống câu hỏi đọc hiểu kèm giải thích cặn kẽ.

### 8. Module Luyện Viết (Writing & Hanzi Stroke - 书写)
- **Tập viết Hán tự**: Bảng vẽ tương tác Canvas cho phép dùng chuột hoặc bút cảm ứng tập viết các nét chữ Hán.
- **Sắp xếp trật tự từ**: Dạng bài kinh điển của phần Viết đề thi HSK (kéo ghép từ thành câu hoàn chỉnh).
- **Viết đoạn văn tự do**: Học sinh viết đoạn văn chữ Hán và AI chấm điểm ngữ pháp, gợi ý diễn đạt chuẩn bản xứ.

### 9. Phòng Thi Thử HSK Thực Chiến (HSK Mock Exams)
- Danh mục đề thi thử HSK 1 - 6 chuẩn cấu trúc quốc tế.
- Đồng hồ đếm ngược (Countdown Timer) chính xác theo thời gian thi thật.
- Cơ chế **Auto-save tiến độ** tự động lưu đáp án phòng trường hợp mất điện hoặc sự cố mạng.
- Nộp bài -> Chấm điểm tự động từng phần (Nghe, Đọc, Viết) -> Xếp loại ĐẠT / KHÔNG ĐẠT theo thang điểm HSK tương ứng (HSK 1-2 pass 120/200, HSK 3-6 pass 180/300).
- Bảng giải thích chi tiết từng câu hỏi đúng/sai.

### 10. Trợ Lý AI Gia Sư Tiếng Trung (AI Tutor Widget)
- Trợ lý AI tích hợp sẵn 4 chế độ:
  1. *Hỏi đáp chung*: Tra cứu từ vựng, giải thích kiến thức bài học.
  2. *Giải thích ngữ pháp*: Phân tích cấu trúc câu và các trợ từ ngữ khí.
  3. *Dịch Trung - Việt*: Dịch song ngữ chuẩn xác theo ngữ cảnh.
  4. *Luyện hội thoại (Roleplay)*: Đóng vai giao tiếp tiếng Trung phản xạ.
- Tích hợp nút phát âm câu nói của AI.

---

## 🛠️ 5. KIẾN TRÚC KỸ THUẬT VÀ THƯ MỤC

```
e:\HTMLL\
├── package.json               # Cấu hình khởi chạy toàn hệ sinh thái
├── PROJECT_PROGRESS.md        # Nhật ký tiến độ 10 giai đoạn
├── README.md                  # Tài liệu hướng dẫn sử dụng & triển khai
│
├── server/                    # BACKEND API & DATABASE (Node.js/Express)
│   ├── server.js              # Entrypoint server, phục vụ API & Frontend SPA
│   ├── config/config.js       # Cấu hình cổng, JWT secret, đường dẫn
│   ├── database/
│   │   ├── db.js              # Database Engine bền vững (File-backed Relational DB)
│   │   ├── seed.js            # Khởi tạo dữ liệu mẫu HSK 1-6 & tài khoản
│   │   └── hsk_platform_data.json # File dữ liệu Database lưu trên đĩa
│   ├── middleware/
│   │   └── authMiddleware.js  # Xác thực JWT Token & Phân quyền Roles
│   ├── services/
│   │   ├── googleSheetsService.js  # Engine đồng bộ Google Sheets 2 chiều
│   │   ├── documentParserService.js # Parser trích xuất Word, Excel, PDF, TXT
│   │   └── aiAnalysisService.js    # AI NLP Classifier & Heuristic Extractor
│   ├── controllers/           # Xử lý logic API (Auth, Sheets, Import, Study, Exam, Tutor)
│   ├── routes/                # Định tuyến RESTful APIs
│   └── uploads/               # Lưu trữ tài liệu upload an toàn (Chặn .exe)
│
└── client/                    # FRONTEND SINGLE-PAGE APP (React + Tailwind CSS)
    ├── index.html             # HTML template với font Noto Sans SC & Inter
    ├── vite.config.js         # Cấu hình Vite, Tailwind v4 và API Proxy
    ├── src/
    │   ├── main.jsx           # React Root
    │   ├── App.jsx            # Điều hướng phân quyền & Layout ứng dụng
    │   ├── context/
    │   │   └── AuthContext.jsx # Quản lý phiên đăng nhập & Dark Mode
    │   ├── services/
    │   │   └── api.js         # HTTP Client & Web Speech TTS phát âm
    │   ├── components/
    │   │   ├── Navbar.jsx     # Header EdTech với Dark Mode & User Profile
    │   │   ├── Sidebar.jsx    # Điều hướng thông minh theo vai trò
    │   │   └── AiTutorWidget.jsx # Hộp chat Trợ lý AI Gia sư tiếng Trung
    │   └── pages/             # Các trang tính năng chính (Login, Dashboard, 4 Kỹ Năng, Thi HSK, AI Import, Google Sheets Sync, Quản Lý User)
    └── dist/                  # Bản build production siêu nhẹ đã được tích hợp
```

---

## 🌐 6. HƯỚNG DẪN TRIỂN KHAI LÊN INTERNET (DEPLOYMENT GUIDE)

### Cách 1: Triển khai lên VPS Ubuntu / Debian (Khuyên dùng)
1. Cài đặt Node.js v20+ trên VPS.
2. Sao chép toàn bộ thư mục dự án lên VPS (ví dụ `/var/www/hskmaster`).
3. Chạy lệnh cài đặt và khởi động nền bằng PM2:
   ```bash
   cd /var/www/hskmaster/server
   npm install
   npm run seed
   npm install -g pm2
   pm2 start server.js --name "hskmaster-ai"
   pm2 startup
   pm2 save
   ```
4. Cấu hình Nginx Reverse Proxy trỏ domain vào cổng `5000`:
   ```nginx
   server {
       server_name your-hsk-domain.com;
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
5. Kích hoạt chứng chỉ SSL miễn phí bằng Certbot:
   `certbot --nginx -d your-hsk-domain.com`

### Cách 2: Triển khai lên Docker Container
Dự án có thể đóng gói thành Docker container duy nhất với file `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY server ./server
COPY client/dist ./client/dist
RUN cd server && npm install --production
EXPOSE 5000
CMD ["node", "server/server.js"]
```

---

## 📞 HỖ TRỢ & BẢO TRÌ
Hệ thống được thiết kế theo cấu trúc module độc lập, hoàn toàn sẵn sàng để mở rộng thêm các cấp độ HSK 7-9, ngân hàng đề thi mới hoặc kết nối trực tiếp vào Supabase / PostgreSQL theo nhu cầu mở rộng quy mô trường học.
