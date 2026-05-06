"use server";

import { prisma }        from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ── Tạo thông báo ─────────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId:  string;
  type:    string;
  title:   string;
  message: string;
  link?:   string;
}) {
  return prisma.notification.create({ data: data as any });
}

// Helper: tìm userId của leader phòng
async function getLeaderUserId(departmentId: string): Promise<string | null> {
  const dept = await prisma.department.findUnique({
    where:   { id: departmentId },
    include: { leader: { include: { user: true } } },
  });
  return dept?.leader?.user?.id ?? null;
}

// Helper: tìm userId của leader HR
async function getHRLeaderUserId(): Promise<string | null> {
  const hrDept = await prisma.department.findFirst({
    where:   { isHR: true },
    include: { leader: { include: { user: true } } },
  });
  return hrDept?.leader?.user?.id ?? null;
}

// ── Nghỉ phép ─────────────────────────────────────────────────────────────────

export async function notifyLeaveSubmitted(leaveId: string) {
  const leave = await prisma.leaveRequest.findUnique({
    where:   { id: leaveId },
    include: { employee: { include: { department: true, user: true } } },
  });
  if (!leave) return;

  const leaderUserId = await getLeaderUserId(leave.employee.departmentId);
  if (!leaderUserId) return;

  await createNotification({
    userId:  leaderUserId,
    type:    "LEAVE_SUBMITTED",
    title:   "Đơn nghỉ phép mới",
    message: `${leave.employee.fullName} gửi đơn nghỉ ${leave.totalDays} ngày. Chờ bạn duyệt.`,
    link:    "/leader/leave",
  });
}

export async function notifyLeaveLeaderApproved(leaveId: string) {
  const leave = await prisma.leaveRequest.findUnique({
    where:   { id: leaveId },
    include: { employee: true },
  });
  if (!leave) return;

  const hrUserId = await getHRLeaderUserId();
  if (!hrUserId) return;

  await createNotification({
    userId:  hrUserId,
    type:    "LEAVE_LEADER_APPROVED",
    title:   "Đơn nghỉ phép chờ HR xác nhận",
    message: `Đơn của ${leave.employee.fullName} đã được leader phòng duyệt. Chờ bạn xác nhận.`,
    link:    "/leader/leave",
  });
}

export async function notifyLeaveApproved(leaveId: string) {
  const leave = await prisma.leaveRequest.findUnique({
    where:   { id: leaveId },
    include: { employee: { include: { user: true } } },
  });
  if (!leave) return;

  await createNotification({
    userId:  leave.employee.user.id,
    type:    "LEAVE_APPROVED",
    title:   "Đơn nghỉ phép được duyệt ✅",
    message: `Đơn nghỉ ${leave.totalDays} ngày của bạn đã được phê duyệt.`,
    link:    "/employee/leave",
  });
}

export async function notifyLeaveRejected(leaveId: string, reason: string) {
  const leave = await prisma.leaveRequest.findUnique({
    where:   { id: leaveId },
    include: { employee: { include: { user: true } } },
  });
  if (!leave) return;

  await createNotification({
    userId:  leave.employee.user.id,
    type:    "LEAVE_REJECTED",
    title:   "Đơn nghỉ phép bị từ chối ❌",
    message: `Đơn nghỉ phép của bạn bị từ chối. Lý do: ${reason}`,
    link:    "/employee/leave",
  });
}

// ── Bổ sung công ──────────────────────────────────────────────────────────────

export async function notifyCorrectionSubmitted(correctionId: string) {
  const c = await prisma.attendanceCorrection.findUnique({
    where:   { id: correctionId },
    include: { employee: { include: { department: true, user: true } } },
  });
  if (!c) return;

  const leaderUserId = await getLeaderUserId(c.employee.departmentId);
  if (!leaderUserId) return;

  await createNotification({
    userId:  leaderUserId,
    type:    "CORRECTION_SUBMITTED",
    title:   "Đơn bổ sung công mới",
    message: `${c.employee.fullName} gửi đơn bổ sung công ngày ${new Date(c.date).toLocaleDateString("vi-VN")}.`,
    link:    "/leader/correction",
  });
}

export async function notifyCorrectionLeaderApproved(correctionId: string) {
  const c = await prisma.attendanceCorrection.findUnique({
    where:   { id: correctionId },
    include: { employee: true },
  });
  if (!c) return;

  const hrUserId = await getHRLeaderUserId();
  if (!hrUserId) return;

  await createNotification({
    userId:  hrUserId,
    type:    "CORRECTION_LEADER_APPROVED",
    title:   "Đơn bổ sung công chờ HR xác nhận",
    message: `Đơn bổ sung công của ${c.employee.fullName} đã được leader duyệt.`,
    link:    "/leader/correction",
  });
}

export async function notifyCorrectionApproved(correctionId: string) {
  const c = await prisma.attendanceCorrection.findUnique({
    where:   { id: correctionId },
    include: { employee: { include: { user: true } } },
  });
  if (!c) return;

  await createNotification({
    userId:  c.employee.user.id,
    type:    "CORRECTION_APPROVED",
    title:   "Bổ sung công được duyệt ✅",
    message: `Đơn bổ sung công ngày ${new Date(c.date).toLocaleDateString("vi-VN")} đã được phê duyệt.`,
    link:    "/employee/correction",
  });
}

export async function notifyCorrectionRejected(correctionId: string, reason: string) {
  const c = await prisma.attendanceCorrection.findUnique({
    where:   { id: correctionId },
    include: { employee: { include: { user: true } } },
  });
  if (!c) return;

  await createNotification({
    userId:  c.employee.user.id,
    type:    "CORRECTION_REJECTED",
    title:   "Đơn bổ sung công bị từ chối ❌",
    message: `Đơn bổ sung công ngày ${new Date(c.date).toLocaleDateString("vi-VN")} bị từ chối. Lý do: ${reason}`,
    link:    "/employee/correction",
  });
}

// ── Query ─────────────────────────────────────────────────────────────────────

export async function getMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    20,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAsRead(id: string) {
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/");
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data:  { isRead: true },
  });
  revalidatePath("/");
}
