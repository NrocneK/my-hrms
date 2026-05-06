"use server";

import { prisma }        from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { HolidayType }   from "@prisma/client";

// ── Query ─────────────────────────────────────────────────────────────────────

export async function getHolidays(year?: number) {
  const y = year ?? new Date().getFullYear();
  return prisma.holiday.findMany({
    where:   { year: y },
    orderBy: { date: "asc" },
  });
}

export async function getHolidayDates(year?: number): Promise<Set<string>> {
  const holidays = await getHolidays(year);
  return new Set(
    holidays.map(h => new Date(h.date).toISOString().split("T")[0])
  );
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createHoliday(data: {
  name: string;
  date: Date;
  type: HolidayType;
}) {
  const dateOnly = new Date(Date.UTC(
    new Date(data.date).getUTCFullYear(),
    new Date(data.date).getUTCMonth(),
    new Date(data.date).getUTCDate(),
  ));
  const year = dateOnly.getUTCFullYear();

  const existing = await prisma.holiday.findUnique({ where: { date: dateOnly } });
  if (existing) throw new Error("Ngày này đã có trong danh sách ngày lễ.");

  await prisma.holiday.create({
    data: { name: data.name, date: dateOnly, type: data.type, year },
  });
  revalidatePath("/admin/holidays");
}

export async function deleteHoliday(id: string) {
  await prisma.holiday.delete({ where: { id } });
  revalidatePath("/admin/holidays");
}

// ── Seed ngày lễ Việt Nam mặc định ───────────────────────────────────────────
// Lưu ý: Tết Nguyên Đán và Giỗ Tổ Hùng Vương thay đổi theo năm âm lịch
// Cần admin tự điều chỉnh ngày chính xác cho từng năm

const FIXED_HOLIDAYS: Record<number, { name: string; month: number; day: number; type: "PUBLIC" | "COMPANY" }[]> = {
  // Ngày cố định hàng năm (dương lịch)
  0: [
    { name: "Tết Dương lịch",          month: 1, day: 1,  type: "PUBLIC" },
    { name: "Ngày Giải phóng miền Nam", month: 4, day: 30, type: "PUBLIC" },
    { name: "Ngày Quốc tế Lao động",   month: 5, day: 1,  type: "PUBLIC" },
    { name: "Quốc khánh",              month: 9, day: 2,  type: "PUBLIC" },
  ],
  // Ngày thay đổi theo năm — cần cập nhật thủ công
  2025: [
    { name: "Tết Nguyên Đán (28 Tết)", month: 1,  day: 25, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (29 Tết)", month: 1,  day: 26, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 1)", month: 1,  day: 29, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 2)", month: 1,  day: 30, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 3)", month: 1,  day: 31, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 4)", month: 2,  day: 1,  type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 5)", month: 2,  day: 2,  type: "PUBLIC" },
    { name: "Giỗ Tổ Hùng Vương",       month: 4,  day: 7,  type: "PUBLIC" },
    { name: "Quốc khánh (nghỉ bù)",    month: 9,  day: 3,  type: "COMPANY" },
  ],
  2026: [
    { name: "Tết Nguyên Đán (nghỉ bù trước)", month: 2,  day: 16, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (28 Tết)",         month: 2,  day: 17, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (29 Tết)",         month: 2,  day: 18, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 1)",         month: 2,  day: 19, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 2)",         month: 2,  day: 20, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 3)",         month: 2,  day: 21, type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 4)",         month: 2,  day: 22, type: "PUBLIC" },
    { name: "Giỗ Tổ Hùng Vương",               month: 4,  day: 26, type: "PUBLIC" },
    // 02/09/2026 là thứ 4 → không có nghỉ bù
  ],
  2027: [
    { name: "Tết Nguyên Đán (Mùng 1)", month: 2,  day: 6,  type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 2)", month: 2,  day: 7,  type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 3)", month: 2,  day: 8,  type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 4)", month: 2,  day: 9,  type: "PUBLIC" },
    { name: "Tết Nguyên Đán (Mùng 5)", month: 2,  day: 10, type: "PUBLIC" },
    { name: "Giỗ Tổ Hùng Vương",       month: 4,  day: 16, type: "PUBLIC" },
  ],
};

export async function seedVietnamHolidays(year: number) {
  const fixed   = FIXED_HOLIDAYS[0]  ?? [];
  const yearly  = FIXED_HOLIDAYS[year] ?? [];
  const all     = [...fixed, ...yearly];

  let created = 0;
  for (const h of all) {
    const date = new Date(Date.UTC(year, h.month - 1, h.day));
    const exists = await prisma.holiday.findUnique({ where: { date } });
    if (!exists) {
      await prisma.holiday.create({
        data: { name: h.name, date, type: h.type, year },
      });
      created++;
    }
  }

  revalidatePath("/admin/holidays");
  return { created, total: all.length };
}

// ── Kiểm tra 1 ngày có phải ngày lễ không ────────────────────────────────────

export async function isHoliday(date: Date): Promise<boolean> {
  const dateOnly = new Date(Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()
  ));
  const h = await prisma.holiday.findUnique({ where: { date: dateOnly } });
  return !!h;
}
