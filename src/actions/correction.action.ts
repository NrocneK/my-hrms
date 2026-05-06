"use server";

import { prisma }        from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  notifyCorrectionSubmitted,
  notifyCorrectionLeaderApproved,
  notifyCorrectionApproved,
  notifyCorrectionRejected,
} from "@/actions/notification.action";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function toVNDateUTC(d: Date): Date {
  const vn = new Date(d.getTime() + VN_OFFSET_MS);
  return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
}

function isLateVN(checkInUTC: Date): boolean {
  const vn = new Date(checkInUTC.getTime() + VN_OFFSET_MS);
  return vn.getUTCHours() > 8 || (vn.getUTCHours() === 8 && vn.getUTCMinutes() > 15);
}

// ── Employee ──────────────────────────────────────────────────────────────────

export async function getCorrectionsByEmployee(employeeId: string) {
  return prisma.attendanceCorrection.findMany({
    where: { employeeId }, orderBy: { createdAt: "desc" },
  });
}

export async function createCorrection(data: {
  employeeId: string; date: Date;
  checkIn: Date; checkOut: Date; reason: string;
}) {
  if (data.checkOut <= data.checkIn) throw new Error("Giờ ra phải sau giờ vào.");
  const dateVN  = toVNDateUTC(data.date);
  const todayVN = toVNDateUTC(new Date());
  if (dateVN > todayVN) throw new Error("Không thể bổ sung công cho ngày tương lai.");

  const conflict = await prisma.attendanceCorrection.findFirst({
    where: { employeeId: data.employeeId, date: dateVN, status: { in: ["PENDING","LEADER_APPROVED"] } },
  });
  if (conflict) throw new Error("Đã có đơn bổ sung công đang xử lý cho ngày này.");

  const correction = await prisma.attendanceCorrection.create({ data: { ...data, date: dateVN } });
  await notifyCorrectionSubmitted(correction.id);
  revalidatePath("/employee/correction");
  return correction;
}

export async function cancelCorrection(id: string, employeeId: string) {
  const c = await prisma.attendanceCorrection.findUnique({ where: { id } });
  if (!c || c.employeeId !== employeeId) throw new Error("Không tìm thấy đơn.");
  if (c.status !== "PENDING") throw new Error("Chỉ có thể hủy đơn đang chờ duyệt.");
  await prisma.attendanceCorrection.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/employee/correction");
}

// ── Leader (vòng 1) ───────────────────────────────────────────────────────────

export async function getPendingCorrectionsForLeader(departmentId: string) {
  return prisma.attendanceCorrection.findMany({
    where: { status: "PENDING", employee: { departmentId } },
    orderBy: { createdAt: "asc" },
    include: { employee: { include: { department: true } } },
  });
}

export async function leaderApproveCorrection(id: string, note?: string) {
  const c = await prisma.attendanceCorrection.findUnique({ where: { id } });
  if (!c || c.status !== "PENDING") throw new Error("Đơn không hợp lệ.");
  await prisma.attendanceCorrection.update({
    where: { id },
    data:  { status: "LEADER_APPROVED", leaderNote: note ?? null, leaderAt: new Date() },
  });
  await notifyCorrectionLeaderApproved(id);
  revalidatePath("/leader/correction");
}

export async function leaderRejectCorrection(id: string, note: string) {
  if (!note.trim()) throw new Error("Vui lòng nhập lý do.");
  const c = await prisma.attendanceCorrection.findUnique({ where: { id } });
  if (!c || c.status !== "PENDING") throw new Error("Đơn không hợp lệ.");
  await prisma.attendanceCorrection.update({
    where: { id },
    data:  { status: "REJECTED", leaderNote: note, leaderAt: new Date() },
  });
  await notifyCorrectionRejected(id, note);
  revalidatePath("/leader/correction");
}

// ── HR Leader (vòng 2) ────────────────────────────────────────────────────────

export async function getLeaderApprovedCorrections() {
  return prisma.attendanceCorrection.findMany({
    where: { status: "LEADER_APPROVED" },
    orderBy: { leaderAt: "asc" },
    include: { employee: { include: { department: true } } },
  });
}

export async function getAllCorrectionsForHR() {
  return prisma.attendanceCorrection.findMany({
    orderBy: { createdAt: "desc" },
    include: { employee: { include: { department: true } } },
  });
}

export async function hrApproveCorrection(id: string, note?: string) {
  const c = await prisma.attendanceCorrection.findUnique({ where: { id } });
  if (!c || c.status !== "LEADER_APPROVED") throw new Error("Đơn chưa qua vòng leader.");
  await prisma.attendanceCorrection.update({
    where: { id },
    data:  { status: "APPROVED", hrNote: note ?? null, hrAt: new Date() },
  });
  const dateOnly = toVNDateUTC(c.date);
  await prisma.attendance.upsert({
    where:  { employeeId_date: { employeeId: c.employeeId, date: dateOnly } },
    update: { checkIn: c.checkIn, checkOut: c.checkOut, status: isLateVN(c.checkIn) ? "LATE" : "PRESENT", note: "Bổ sung công đã duyệt" },
    create: { employeeId: c.employeeId, date: dateOnly, checkIn: c.checkIn, checkOut: c.checkOut, status: isLateVN(c.checkIn) ? "LATE" : "PRESENT", note: "Bổ sung công đã duyệt" },
  });
  await notifyCorrectionApproved(id);
  revalidatePath("/leader/correction");
  revalidatePath("/employee/correction");
  revalidatePath("/employee/attendance");
  revalidatePath("/employee/dashboard");
}

export async function hrRejectCorrection(id: string, note: string) {
  if (!note.trim()) throw new Error("Vui lòng nhập lý do.");
  const c = await prisma.attendanceCorrection.findUnique({ where: { id } });
  if (!c || c.status !== "LEADER_APPROVED") throw new Error("Đơn không hợp lệ.");
  await prisma.attendanceCorrection.update({
    where: { id },
    data:  { status: "REJECTED", hrNote: note, hrAt: new Date() },
  });
  await notifyCorrectionRejected(id, note);
  revalidatePath("/leader/correction");
  revalidatePath("/employee/correction");
}
