"use server";

import { prisma } from "@/lib/prisma";
import bcrypt     from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function resetPassword(userId: string) {
  const hashed = await bcrypt.hash("123456", 10);
  await prisma.user.update({
    where: { id: userId },
    data:  { password: hashed },
  });
  revalidatePath("/admin/employees");
}

export async function changePassword(
  userId:          string,
  currentPassword: string,
  newPassword:     string
) {
  if (newPassword.length < 6) throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Không tìm thấy tài khoản.");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error("Mật khẩu hiện tại không đúng.");

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  revalidatePath("/employee/profile");
}

export async function seedAdminUser() {
  const existing = await prisma.user.findUnique({ where: { loginId: "ADMIN" } });
  if (existing) return { message: "Admin đã tồn tại." };

  const hashed = await bcrypt.hash("123456", 10);
  await prisma.user.create({
    data: {
      email:    "admin@hrms.com",
      loginId:  "ADMIN",
      password: hashed,
      role:     "ADMIN",
    },
  });
  return { message: "Tạo admin thành công." };
}
