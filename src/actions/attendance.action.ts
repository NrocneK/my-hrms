"use server";

import { prisma }        from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── Timezone helper ───────────────────────────────────────────────────────────
// Server có thể chạy UTC, cần tính ngày theo UTC+7 (Việt Nam)
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function getTodayVN(): Date {
  const nowUTC  = Date.now();
  const nowVN   = new Date(nowUTC + VN_OFFSET_MS);
  // Lấy ngày tháng năm theo giờ VN, rồi tạo lại thành UTC midnight để lưu DB
  return new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));
}

function getNowVN(): Date {
  return new Date(Date.now() + VN_OFFSET_MS);
}

function isLateVN(d: Date): boolean {
  // d đang là giờ VN
  return d.getUTCHours() > 8 || (d.getUTCHours() === 8 && d.getUTCMinutes() > 15);
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAttendanceByEmployee(
  employeeId: string,
  month?: number,
  year?: number
) {
  const nowVN = getNowVN();
  const m = month ?? nowVN.getUTCMonth() + 1;
  const y = year  ?? nowVN.getUTCFullYear();

  const start = new Date(Date.UTC(y, m - 1, 1));
  const end   = new Date(Date.UTC(y, m, 0, 23, 59, 59));

  return prisma.attendance.findMany({
    where:   { employeeId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });
}

export async function getTodayAttendance(employeeId: string) {
  const today = getTodayVN();
  return prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function checkIn(employeeId: string) {
  const today  = getTodayVN();
  const nowVN  = getNowVN();

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (existing) throw new Error("Bạn đã check-in hôm nay rồi.");

  // Dùng giờ thực (UTC) để lưu, client sẽ format theo locale
  const now    = new Date();
  const record = await prisma.attendance.create({
    data: {
      employeeId,
      date:    today,
      checkIn: now,
      status:  isLateVN(nowVN) ? "LATE" : "PRESENT",
    },
  });

  revalidatePath("/employee/attendance");
  revalidatePath("/employee/dashboard");
  return record;
}

export async function checkOut(employeeId: string) {
  const today = getTodayVN();

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });
  if (!existing)         throw new Error("Bạn chưa check-in hôm nay.");
  if (existing.checkOut) throw new Error("Bạn đã check-out hôm nay rồi.");

  const record = await prisma.attendance.update({
    where: { id: existing.id },
    data:  { checkOut: new Date() },
  });

  revalidatePath("/employee/attendance");
  revalidatePath("/employee/dashboard");
  return record;
}

export async function getMonthlyStats(employeeId: string, month?: number, year?: number) {
  const records = await getAttendanceByEmployee(employeeId, month, year);
  return {
    present: records.filter(r => r.status === "PRESENT").length,
    late:    records.filter(r => r.status === "LATE").length,
    absent:  records.filter(r => r.status === "ABSENT").length,
    halfDay: records.filter(r => r.status === "HALF_DAY").length,
    leave:   records.filter(r => r.status === "LEAVE").length,
    records,
  };
}
