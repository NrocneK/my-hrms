"use server";

import { prisma } from "@/lib/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────────

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

async function getHolidayDatesInMonth(year: number, month: number): Promise<Set<string>> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 0));
  const holidays = await prisma.holiday.findMany({
    where: { date: { gte: start, lte: end } },
  });
  return new Set(holidays.map(h => h.date.toISOString().split("T")[0]));
}

function getWorkDaysInMonth(year: number, month: number, holidayDates: Set<string> = new Set()): number {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    const day  = new Date(year, month - 1, d).getDay();
    const key  = date.toISOString().split("T")[0];
    // Không tính T7, CN và ngày lễ
    if (day !== 0 && day !== 6 && !holidayDates.has(key)) count++;
  }
  return count;
}

// ── Core tính lương 1 nhân viên 1 tháng ──────────────────────────────────────

export interface PayrollRecord {
  employeeId:    string;
  employeeCode:  string;
  fullName:      string;
  department:    string;
  position:      string;
  baseSalary:    number;   // Lương cơ bản
  workDaysTotal: number;   // Tổng ngày làm việc trong tháng
  workDaysActual:number;   // Ngày công thực tế (có mặt + trễ + nghỉ phép)
  presentDays:   number;
  lateDays:      number;
  leaveDays:     number;   // Nghỉ phép được duyệt → vẫn tính lương
  absentDays:    number;   // Vắng không phép → trừ lương
  lateDeduction: number;   // Khấu trừ đi trễ (mỗi lần = 0.5 ngày lương)
  absentDeduction: number; // Khấu trừ vắng
  grossSalary:   number;   // Lương thực nhận trước thuế
  month:         number;
  year:          number;
}

export async function calcPayroll(
  employeeId: string,
  month: number,
  year: number
): Promise<PayrollRecord> {
  const emp = await prisma.employee.findUnique({
    where:   { id: employeeId },
    include: { department: true },
  });
  if (!emp) throw new Error("Không tìm thấy nhân viên.");

  // Khoảng thời gian tháng (UTC)
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const attendances = await prisma.attendance.findMany({
    where: { employeeId, date: { gte: start, lte: end } },
  });

  // Lấy ngày lễ trong tháng để tính đúng tổng ngày làm việc
  const holidayDates   = await getHolidayDatesInMonth(year, month);
  const workDaysTotal  = getWorkDaysInMonth(year, month, holidayDates);
  const dailyRate      = emp.salary / workDaysTotal;

  const presentDays = attendances.filter(a => a.status === "PRESENT").length;
  const lateDays    = attendances.filter(a => a.status === "LATE").length;
  const leaveDays   = attendances.filter(a => a.status === "LEAVE").length;
  const absentDays  = attendances.filter(a => a.status === "ABSENT").length;

  // Đi trễ: mỗi lần khấu trừ 0.5 ngày lương
  const lateDeduction   = lateDays * dailyRate * 0.5;
  // Vắng: mỗi ngày khấu trừ 1 ngày lương
  const absentDeduction = absentDays * dailyRate;

  // Ngày công thực tế = có mặt + trễ + nghỉ phép (nghỉ phép vẫn hưởng lương)
  const workDaysActual = presentDays + lateDays + leaveDays;

  const grossSalary = Math.round(
    (workDaysActual * dailyRate) - lateDeduction
  );

  return {
    employeeId:     emp.id,
    employeeCode:   emp.employeeCode,
    fullName:       emp.fullName,
    department:     emp.department.name,
    position:       emp.position,
    baseSalary:     emp.salary,
    workDaysTotal,
    workDaysActual,
    presentDays,
    lateDays,
    leaveDays,
    absentDays,
    lateDeduction:    Math.round(lateDeduction),
    absentDeduction:  Math.round(absentDeduction),
    grossSalary:      Math.max(0, grossSalary),
    month,
    year,
  };
}

// ── Lấy bảng lương của 1 nhân viên (nhiều tháng) ─────────────────────────────

export async function getMyPayroll(employeeId: string) {
  // Lấy 6 tháng gần nhất
  const now    = new Date(Date.now() + VN_OFFSET_MS);
  const month  = now.getUTCMonth() + 1;
  const year   = now.getUTCFullYear();

  const results: PayrollRecord[] = [];
  for (let i = 0; i < 6; i++) {
    let m = month - i;
    let y = year;
    if (m <= 0) { m += 12; y--; }
    results.push(await calcPayroll(employeeId, m, y));
  }
  return results;
}

// ── Lấy bảng lương cả phòng (theo tháng) ─────────────────────────────────────

export async function getDepartmentPayroll(departmentId: string, month: number, year: number) {
  const employees = await prisma.employee.findMany({
    where:   { departmentId, isActive: true },
    select:  { id: true },
  });

  return Promise.all(employees.map(e => calcPayroll(e.id, month, year)));
}

// ── Lấy bảng lương toàn công ty (theo tháng) ─────────────────────────────────

export async function getAllPayroll(month: number, year: number) {
  const employees = await prisma.employee.findMany({
    where:  { isActive: true },
    select: { id: true },
    orderBy: [{ departmentId: "asc" }, { fullName: "asc" }],
  });

  return Promise.all(employees.map(e => calcPayroll(e.id, month, year)));
}

// ── Tổng quỹ lương theo tháng ─────────────────────────────────────────────────

export async function getPayrollSummary(month: number, year: number) {
  const records = await getAllPayroll(month, year);

  const totalGross    = records.reduce((s, r) => s + r.grossSalary,      0);
  const totalBase     = records.reduce((s, r) => s + r.baseSalary,       0);
  const totalDeduct   = records.reduce((s, r) => s + r.lateDeduction + r.absentDeduction, 0);
  const totalAbsent   = records.reduce((s, r) => s + r.absentDays,       0);
  const totalLate     = records.reduce((s, r) => s + r.lateDays,         0);

  return { records, totalGross, totalBase, totalDeduct, totalAbsent, totalLate };
}
