# HRMS — Hệ thống Quản lý Nhân sự

Ứng dụng quản lý nhân sự xây dựng bằng **Next.js 14**, **Prisma**, **MySQL (PlanetScale)**, **NextAuth.js**, và **Tailwind CSS**.

---

## ✨ Tính năng

- 🔐 Đăng nhập với email/mật khẩu (NextAuth.js)
- 👥 Quản lý nhân viên (Admin/HR)
- 🏢 Quản lý phòng ban
- 📋 Chấm công (check-in / check-out)
- 👤 Hồ sơ cá nhân nhân viên
- 🛡️ Phân quyền: Admin/HR vs Nhân viên
- 📱 Responsive trên mọi thiết bị

---

## 🚀 Hướng dẫn cài đặt

### 1. Clone & cài dependencies

```bash
git clone <your-repo>
cd my-hrms
npm install
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
# PlanetScale MySQL connection string
DATABASE_URL="mysql://username:password@host/database?sslaccept=strict"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"   # tạo bằng: openssl rand -base64 32
```

### 3. Kết nối PlanetScale

1. Tạo tài khoản tại [planetscale.com](https://planetscale.com)
2. Tạo database mới
3. Lấy connection string và dán vào `DATABASE_URL`

### 4. Push schema lên database

```bash
npm run db:push
```

### 5. Tạo tài khoản Admin đầu tiên

```bash
npx tsx src/scripts/seed.ts
```

Hoặc gọi API: `POST /api/seed`

Tài khoản mặc định:
- Email: `admin@hrms.com`
- Password: `Admin@123`

### 6. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

---

## 📁 Cấu trúc project

```
src/
├── app/
│   ├── (auth)/login/         # Trang đăng nhập
│   ├── (dashboard)/
│   │   ├── admin/            # Khu vực Admin/HR
│   │   └── employee/         # Khu vực Nhân viên
│   └── api/auth/             # NextAuth handler
├── actions/                  # Server Actions (business logic)
├── components/
│   ├── forms/                # Form components
│   ├── layout/               # Sidebar, Header
│   └── ui/                   # Button, Input, Badge...
├── lib/                      # prisma.ts, auth.ts, utils.ts
└── types/                    # TypeScript types
```

---

## 🌐 Deploy lên Vercel

1. Push code lên GitHub
2. Import repo vào [vercel.com](https://vercel.com)
3. Thêm các biến môi trường (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
4. Deploy!

---

## 🛠️ Scripts

| Command | Mô tả |
|---|---|
| `npm run dev` | Chạy development server |
| `npm run build` | Build production |
| `npm run db:push` | Push Prisma schema lên DB |
| `npm run db:studio` | Mở Prisma Studio (GUI) |
| `npm run db:generate` | Generate Prisma Client |
