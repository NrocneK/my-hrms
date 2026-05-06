# 🚀 Hướng dẫn Deploy lên Vercel + PlanetScale

## BƯỚC 1 — Tạo database PlanetScale

1. Vào [planetscale.com](https://planetscale.com) → **Sign Up Free**
2. Tạo database mới → đặt tên `my-hrms` → chọn region gần nhất (Singapore)
3. Vào tab **Connect** → chọn **Prisma** → copy `DATABASE_URL`
   ```
   mysql://xxxxxxxx:pscale_pw_xxxxxxxx@aws.connect.psdb.cloud/my-hrms?sslaccept=strict
   ```
4. Vào tab **Branches** → branch `main` → bật **Safe migrations** OFF
   (để Prisma db push hoạt động)

---

## BƯỚC 2 — Cập nhật Schema cho PlanetScale

Mở `prisma/schema.prisma`, sửa datasource:

```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"   // ← Bỏ comment dòng này
}
```

---

## BƯỚC 3 — Push schema lên PlanetScale

Tạm thời thay DATABASE_URL trong `.env` bằng URL PlanetScale, rồi:

```bash
npm run db:push
npm run seed       # Tạo dữ liệu ban đầu
```

Sau đó đổi lại DATABASE_URL về local nếu muốn tiếp tục dev.

---

## BƯỚC 4 — Push code lên GitHub

```bash
git init                          # Nếu chưa có git
git add .
git commit -m "feat: initial commit"

# Tạo repo trên github.com rồi:
git remote add origin https://github.com/YOUR_USERNAME/my-hrms.git
git push -u origin main
```

---

## BƯỚC 5 — Deploy lên Vercel

1. Vào [vercel.com](https://vercel.com) → **Add New Project**
2. Import repo GitHub vừa tạo
3. **Framework Preset**: Next.js (tự detect)
4. Vào **Environment Variables** → thêm từng biến:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | URL PlanetScale |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Random string 32 chars |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `hrms_avatars` |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |

5. Click **Deploy** → đợi ~2 phút

---

## BƯỚC 6 — Sau khi deploy xong

1. Copy URL Vercel (VD: `https://my-hrms-abc123.vercel.app`)
2. Vào Vercel → **Settings** → **Environment Variables**
3. Cập nhật `NEXTAUTH_URL` = URL Vercel thật
4. **Redeploy** để áp dụng

---

## ✅ Kiểm tra

- Truy cập URL Vercel → trang login
- Đăng nhập bằng `ADMIN / 123456`
- Test các tính năng cơ bản

---

## 🔄 Deploy lại sau khi có thay đổi

```bash
git add .
git commit -m "feat: description"
git push
# Vercel tự động deploy!
```

---

## ⚠️ Lưu ý quan trọng

- **Không commit file `.env`** — đã có trong `.gitignore`
- PlanetScale free tier: **1 database, 5GB storage**
- Vercel free tier: **100GB bandwidth/tháng**
- Mỗi lần thay đổi schema: chạy `npm run db:push` với PlanetScale URL

