# EduNexus Backend

Backend Node.js theo kiến trúc REST API, dùng Express + Sequelize ORM + MySQL. Các model Sequelize là nguồn định nghĩa database (code-first); `sequelize.sync()` trong `server.js` tự tạo các bảng và khóa ngoại.

## Cấu trúc

```text
BE/
├── server.js                 # Kết nối MySQL, sync code-first, seed, mở HTTP server
├── .env.example
└── src/
    ├── app.js
    ├── config/database.js    # Cấu hình Sequelize/MySQL
    ├── models/               # Entity và relationship
    ├── controllers/          # Xử lý nghiệp vụ HTTP
    ├── routes/               # Endpoint
    ├── middleware/           # JWT, phân quyền, xử lý lỗi
    ├── seeders/              # Dữ liệu mẫu
    └── utils/
```

## Cài đặt và kết nối MySQL

1. Tạo một database rỗng trong MySQL:

```sql
CREATE DATABASE swedunexus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Sao chép `.env.example` thành `.env`, rồi sửa `DB_USER` và `DB_PASSWORD` theo MySQL Server của bạn.
3. Chạy:

```bash
npm install
npm run dev
```

Lần đầu khởi động, `server.js` sẽ kết nối MySQL, tự tạo bảng từ models và thêm dữ liệu mẫu. Không cần tự viết lệnh `CREATE TABLE`.

Không bật `DB_ALTER=true` trong production; khi dự án lớn lên nên chuyển sang Sequelize migrations.

## Tài khoản seed

| Role | Email | Password |
|---|---|---|
| Admin | admin@edunexus.vn | 123456 |
| Teacher | teacher@edunexus.vn | 123456 |
| SME | sme@edunexus.vn | 123456 |
| Student | student@edunexus.vn | 123456 |
| Manager | manager@edunexus.vn | 123456 |

## API chính

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/categories`
- `GET /api/courses`
- `GET /api/courses/:id`
- `POST|PUT|DELETE /api/courses` (theo role)
- `GET|POST|PUT|DELETE /api/users` (admin)

Ví dụ đăng nhập:

```json
POST /api/auth/login
{
  "email": "admin@edunexus.vn",
  "password": "123456"
}
```
