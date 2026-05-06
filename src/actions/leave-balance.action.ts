"use server";

import { prisma }        from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULT_ANNUAL_DAYS = 12;

// ── Lấy hoặc tạo balance cho năm hiện tại ────────────────────────────────────

export async function getOrCreateBalance(employeeId: string, year?: number) {
  const y = year ?? new Date().getFullYear();

  // Tính số ngày phép đã dùng từ đơn APPROVED loại ANNUAL trong năm
  const start = new Date(y, 0, 1);
  const end   = new Date(y, 11, 31, 23, 59, 59);

  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status:    "APPROVED",
      type:      "ANNUAL",
      startDate: { gte: start, lte: end },
    },
  });

  const usedDays = approvedLeaves.reduce((s, l) => s + l.totalDays, 0);

  // Upsert balance
  const balance = await prisma.leaveBalance.upsert({
    where:  { employeeId_year: { employeeId, year: y } },
    update: { usedDays },
    create: { employeeId, year: y, totalDays: DEFAULT_ANNUAL_DAYS, usedDays },
  });

  return {
    ...balance,
    remainingDays: Math.max(0, balance.totalDays - usedDays),
    usedDays,
  };
}

// ── Lấy balance của nhiều nhân viên (cho leader/admin) ───────────────────────

export async function getDepartmentBalances(departmentId: string, year?: number) {
  const y = year ?? new Date().getFullYear();

  const employees = await prisma.employee.findMany({
    where:   { departmentId, isActive: true },
    select:  { id: true, fullName: true, employeeCode: true, position: true },
    orderBy: { fullName: "asc" },
  });

  return Promise.all(
    employees.map(async emp => {
      const balance = await getOrCreateBalance(emp.id, y);
      return { ...emp, ...balance };
    })
  );
}

export async function getAllBalances(year?: number) {
  const y = year ?? new Date().getFullYear();

  const employees = await prisma.employee.findMany({
    where:   { isActive: true },
    include: { department: true },
    orderBy: [{ departmentId: "asc" }, { fullName: "asc" }],
  });

  return Promise.all(
    employees.map(async emp => {
      const balance = await getOrCreateBalance(emp.id, y);
      return {
        ...balance,
        fullName:     emp.fullName,
        employeeCode: emp.employeeCode,
        position:     emp.position,
        department:   emp.department.name,
      };
    })
  );
}

// ── Admin: điều chỉnh tổng ngày phép ─────────────────────────────────────────

export async function updateTotalDays(employeeId: string, year: number, totalDays: number) {
  if (totalDays < 0 || totalDays > 365) throw new Error("Số ngày không hợp lệ.");

  await prisma.leaveBalance.upsert({
    where:  { employeeId_year: { employeeId, year } },
    update: { totalDays },
    create: { employeeId, year, totalDays },
  });

  revalidatePath("/admin/leave");
  revalidatePath("/employee/leave");
}

// ── Kiểm tra trước khi tạo đơn ANNUAL ────────────────────────────────────────

export async function checkLeaveBalance(
  employeeId: string,
  requestedDays: number,
  year?: number
): Promise<{ ok: boolean; remaining: number; message?: string }> {
  const y       = year ?? new Date().getFullYear();
  const balance = await getOrCreateBalance(employeeId, y);

  if (balance.remainingDays < requestedDays) {
    return {
      ok:        false,
      remaining: balance.remainingDays,
      message:   `Không đủ ngày phép. Còn lại: ${balance.remainingDays} ngày, yêu cầu: ${requestedDays} ngày.`,
    };
  }

  return { ok: true, remaining: balance.remainingDays };
}
