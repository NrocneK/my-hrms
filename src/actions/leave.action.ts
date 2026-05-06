"use server";

import { prisma }        from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LeaveType }     from "@prisma/client";
import {
  notifyLeaveSubmitted,
  notifyLeaveLeaderApproved,
  notifyLeaveApproved,
  notifyLeaveRejected,
} from "@/actions/notification.action";
import { checkLeaveBalance } from "@/actions/leave-balance.action";

function calcWorkDays(start: Date, end: Date) {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

async function applyLeaveToAttendance(leaveId: string) {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId }, include: { employee: true },
  });
  if (!leave) return;
  const cur = new Date(leave.startDate);
  while (cur <= leave.endDate) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) {
      const d = new Date(cur); d.setHours(0,0,0,0);
      await prisma.attendance.upsert({
        where:  { employeeId_date: { employeeId: leave.employeeId, date: d } },
        update: { status: "LEAVE", note: `Nghỉ phép - ${leave.type}` },
        create: { employeeId: leave.employeeId, date: d, status: "LEAVE", note: `Nghỉ phép - ${leave.type}` },
      });
    }
    cur.setDate(cur.getDate() + 1);
  }
}

// ── Employee ──────────────────────────────────────────────────────────────────

export async function getLeavesByEmployee(employeeId: string) {
  return prisma.leaveRequest.findMany({
    where: { employeeId }, orderBy: { createdAt: "desc" },
  });
}

export async function createLeaveRequest(data: {
  employeeId: string; type: LeaveType;
  startDate: Date; endDate: Date; reason: string;
}) {
  const totalDays = calcWorkDays(data.startDate, data.endDate);
  if (totalDays <= 0) throw new Error("Ngày nghỉ không hợp lệ.");

  // Kiểm tra số ngày phép còn lại (chỉ với loại ANNUAL)
  if (data.type === "ANNUAL") {
    const year   = new Date(data.startDate).getFullYear();
    const check  = await checkLeaveBalance(data.employeeId, totalDays, year);
    if (!check.ok) throw new Error(check.message);
  }

  const conflict = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: data.employeeId,
      status: { in: ["PENDING","LEADER_APPROVED","APPROVED"] },
      OR: [{ startDate: { lte: data.endDate }, endDate: { gte: data.startDate } }],
    },
  });
  if (conflict) throw new Error("Đã có đơn nghỉ phép trong khoảng thời gian này.");

  const leave = await prisma.leaveRequest.create({ data: { ...data, totalDays } });

  // Thông báo cho leader phòng
  await notifyLeaveSubmitted(leave.id);

  revalidatePath("/employee/leave");
  return leave;
}

export async function cancelLeave(id: string, employeeId: string) {
  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave || leave.employeeId !== employeeId) throw new Error("Không tìm thấy đơn.");
  if (leave.status !== "PENDING") throw new Error("Chỉ có thể hủy đơn đang chờ duyệt.");
  await prisma.leaveRequest.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/employee/leave");
}

// ── Leader (vòng 1) ───────────────────────────────────────────────────────────

export async function getPendingLeavesForLeader(departmentId: string) {
  return prisma.leaveRequest.findMany({
    where: { status: "PENDING", employee: { departmentId } },
    orderBy: { createdAt: "asc" },
    include: { employee: { include: { department: true } } },
  });
}

export async function leaderApproveLeave(id: string, note?: string) {
  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave || leave.status !== "PENDING") throw new Error("Đơn không hợp lệ.");
  await prisma.leaveRequest.update({
    where: { id },
    data:  { status: "LEADER_APPROVED", leaderNote: note ?? null, leaderAt: new Date() },
  });
  await notifyLeaveLeaderApproved(id);
  revalidatePath("/leader/leave");
}

export async function leaderRejectLeave(id: string, note: string) {
  if (!note.trim()) throw new Error("Vui lòng nhập lý do từ chối.");
  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave || leave.status !== "PENDING") throw new Error("Đơn không hợp lệ.");
  await prisma.leaveRequest.update({
    where: { id },
    data:  { status: "REJECTED", leaderNote: note, leaderAt: new Date() },
  });
  await notifyLeaveRejected(id, note);
  revalidatePath("/leader/leave");
  revalidatePath("/employee/leave");
}

// ── HR Leader (vòng 2) ────────────────────────────────────────────────────────

export async function getLeaderApprovedLeaves() {
  return prisma.leaveRequest.findMany({
    where: { status: "LEADER_APPROVED" },
    orderBy: { leaderAt: "asc" },
    include: { employee: { include: { department: true } } },
  });
}

export async function getAllLeavesForHR() {
  return prisma.leaveRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { employee: { include: { department: true } } },
  });
}

export async function hrApproveLeave(id: string, note?: string) {
  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave || leave.status !== "LEADER_APPROVED") throw new Error("Đơn chưa qua vòng leader.");
  await prisma.leaveRequest.update({
    where: { id },
    data:  { status: "APPROVED", hrNote: note ?? null, hrAt: new Date() },
  });
  await applyLeaveToAttendance(id);
  await notifyLeaveApproved(id);
  revalidatePath("/leader/leave");
  revalidatePath("/employee/leave");
  revalidatePath("/employee/dashboard");
}

export async function hrRejectLeave(id: string, note: string) {
  if (!note.trim()) throw new Error("Vui lòng nhập lý do từ chối.");
  const leave = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!leave || leave.status !== "LEADER_APPROVED") throw new Error("Đơn không hợp lệ.");
  await prisma.leaveRequest.update({
    where: { id },
    data:  { status: "REJECTED", hrNote: note, hrAt: new Date() },
  });
  await notifyLeaveRejected(id, note);
  revalidatePath("/leader/leave");
  revalidatePath("/employee/leave");
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAllLeavesForAdmin() {
  return prisma.leaveRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { employee: { include: { department: true } } },
  });
}
