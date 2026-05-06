"use server";

import { prisma } from "@/lib/prisma";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function getNowVN() {
  return new Date(Date.now() + VN_OFFSET_MS);
}

function getWorkDaysInMonth(year: number, month: number): number {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

// ── Thống kê chấm công 6 tháng (toàn công ty hoặc 1 phòng) ───────────────────

export async function getAttendanceTrend(departmentId?: string) {
  const now   = getNowVN();
  const month = now.getUTCMonth() + 1;
  const year  = now.getUTCFullYear();

  const results = [];

  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    if (m <= 0) { m += 12; y--; }

    const start = new Date(Date.UTC(y, m - 1, 1));
    const end   = new Date(Date.UTC(y, m, 0, 23, 59, 59));

    const where = departmentId
      ? { date: { gte: start, lte: end }, employee: { departmentId } }
      : { date: { gte: start, lte: end } };

    const [present, late, absent, leave] = await Promise.all([
      prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
      prisma.attendance.count({ where: { ...where, status: "LATE"    } }),
      prisma.attendance.count({ where: { ...where, status: "ABSENT"  } }),
      prisma.attendance.count({ where: { ...where, status: "LEAVE"   } }),
    ]);

    results.push({
      label: `T${m}/${y}`,
      month: m, year: y,
      present, late, absent, leave,
      total: present + late + absent + leave,
    });
  }

  return results;
}

// ── Tỷ lệ chấm công theo phòng ban (tháng hiện tại) ──────────────────────────

export async function getDepartmentAttendanceStats(month?: number, year?: number) {
  const now = getNowVN();
  const m   = month ?? now.getUTCMonth() + 1;
  const y   = year  ?? now.getUTCFullYear();

  const start = new Date(Date.UTC(y, m - 1, 1));
  const end   = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  const workDays = getWorkDaysInMonth(y, m);

  const departments = await prisma.department.findMany({
    include: {
      employees: {
        where: { isActive: true },
        include: {
          attendances: {
            where: { date: { gte: start, lte: end } },
          },
        },
      },
    },
  });

  return departments.map(dept => {
    const empCount   = dept.employees.length;
    if (empCount === 0) return { name: dept.name, present: 0, late: 0, absent: 0, leave: 0, rate: 0 };

    const allAtt     = dept.employees.flatMap(e => e.attendances);
    const present    = allAtt.filter(a => a.status === "PRESENT").length;
    const late       = allAtt.filter(a => a.status === "LATE").length;
    const absent     = allAtt.filter(a => a.status === "ABSENT").length;
    const leave      = allAtt.filter(a => a.status === "LEAVE").length;
    const expected   = empCount * workDays;
    const actual     = present + late + leave;
    const rate       = expected > 0 ? Math.round((actual / expected) * 100) : 0;

    return { name: dept.name, present, late, absent, leave, rate, empCount };
  }).filter(d => d.empCount > 0);
}

// ── Top nhân viên vắng/trễ nhiều nhất ────────────────────────────────────────

export async function getTopAbsentEmployees(limit = 5, departmentId?: string) {
  const now   = getNowVN();
  const month = now.getUTCMonth() + 1;
  const year  = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      department: true,
      attendances: {
        where: { date: { gte: start, lte: end } },
      },
    },
  });

  return employees
    .map(emp => ({
      id:         emp.id,
      fullName:   emp.fullName,
      department: emp.department.name,
      absent:     emp.attendances.filter(a => a.status === "ABSENT").length,
      late:       emp.attendances.filter(a => a.status === "LATE").length,
    }))
    .filter(e => e.absent > 0 || e.late > 0)
    .sort((a, b) => (b.absent * 2 + b.late) - (a.absent * 2 + a.late))
    .slice(0, limit);
}

// ── Tổng quan nhanh ───────────────────────────────────────────────────────────

export async function getCompanyOverview() {
  const now   = getNowVN();
  const month = now.getUTCMonth() + 1;
  const year  = now.getUTCFullYear();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const [
    totalEmp, totalDept, totalLeader,
    pendingLeaves, pendingCorrections,
    thisMonthAtt,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.department.count(),
    prisma.user.count({ where: { role: "LEADER" } }),
    prisma.leaveRequest.count({ where: { status: { in: ["PENDING", "LEADER_APPROVED"] } } }),
    prisma.attendanceCorrection.count({ where: { status: { in: ["PENDING", "LEADER_APPROVED"] } } }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { date: { gte: start, lte: end } },
      _count: { status: true },
    }),
  ]);

  const attMap = Object.fromEntries(thisMonthAtt.map(a => [a.status, a._count.status]));

  return {
    totalEmp, totalDept, totalLeader,
    pendingLeaves, pendingCorrections,
    thisMonth: {
      present: attMap["PRESENT"] ?? 0,
      late:    attMap["LATE"]    ?? 0,
      absent:  attMap["ABSENT"]  ?? 0,
      leave:   attMap["LEAVE"]   ?? 0,
    },
    month, year,
  };
}

// ── Báo cáo phòng ban chi tiết ────────────────────────────────────────────────

export async function getDepartmentDetailReport(departmentId: string, month?: number, year?: number) {
  const now = getNowVN();
  const m   = month ?? now.getUTCMonth() + 1;
  const y   = year  ?? now.getUTCFullYear();
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end   = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  const workDays = getWorkDaysInMonth(y, m);

  const employees = await prisma.employee.findMany({
    where:   { departmentId, isActive: true },
    include: {
      attendances: { where: { date: { gte: start, lte: end } } },
    },
    orderBy: { fullName: "asc" },
  });

  return employees.map(emp => {
    const att     = emp.attendances;
    const present = att.filter(a => a.status === "PRESENT").length;
    const late    = att.filter(a => a.status === "LATE").length;
    const absent  = att.filter(a => a.status === "ABSENT").length;
    const leave   = att.filter(a => a.status === "LEAVE").length;
    const rate    = workDays > 0 ? Math.round(((present + late + leave) / workDays) * 100) : 0;

    return { id: emp.id, fullName: emp.fullName, position: emp.position, workDays, present, late, absent, leave, rate };
  });
}
