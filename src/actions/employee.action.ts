"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { generateEmployeeCode } from "@/lib/utils";
import { Role } from "@prisma/client";

export async function getEmployees() {
  return prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      department: true,
      user: { select: { email: true, role: true } },
      leadingDepartment: { select: { id: true, name: true } },
    },
  });
}

export async function getEmployeeById(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      user: { select: { email: true, role: true } },
      leadingDepartment: { select: { id: true, name: true } },
    },
  });
}

export async function getEmployeeByUserId(userId: string) {
  return prisma.employee.findUnique({
    where: { userId },
    include: {
      department: { include: { leader: true } },
      leadingDepartment: true,
    },
  });
}

export async function createEmployee(data: {
  email: string;
  password: string;
  role: Role;
  fullName: string;
  phone?: string;
  position: string;
  salary: number;
  departmentId: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: Date;
  address?: string;
  joinDate?: Date;
}) {
  const count = await prisma.employee.count();
  const employeeCode = generateEmployeeCode(count + 1);
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await prisma.user.create({
    data: {
      email:    data.email,
      loginId:  employeeCode,   // dùng mã NV làm loginId
      password: hashedPassword,
      role:     data.role,
      employee: {
        create: {
          employeeCode,
          fullName:     data.fullName,
          phone:        data.phone,
          position:     data.position,
          salary:       data.salary,
          departmentId: data.departmentId,
          gender:       data.gender,
          dateOfBirth:  data.dateOfBirth,
          address:      data.address,
          joinDate:     data.joinDate ?? new Date(),
        },
      },
    },
    include: { employee: true },
  });

  revalidatePath("/admin/employees");
  return result;
}

export async function updateEmployee(
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    position?: string;
    salary?: number;
    departmentId?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth?: Date;
    address?: string;
    isActive?: boolean;
  }
) {
  const emp = await prisma.employee.update({ where: { id }, data });
  revalidatePath("/admin/employees");
  return emp;
}

export async function deleteEmployee(id: string) {
  const emp = await prisma.employee.findUnique({ where: { id }, select: { userId: true } });
  if (emp) await prisma.user.delete({ where: { id: emp.userId } });
  revalidatePath("/admin/employees");
}

export async function getTotalStats() {
  const [totalEmployees, totalDepartments, activeEmployees] = await Promise.all([
    prisma.employee.count(),
    prisma.department.count(),
    prisma.employee.count({ where: { isActive: true } }),
  ]);
  return { totalEmployees, totalDepartments, activeEmployees };
}

// Lấy leader của phòng ban
export async function getLeaderByDepartment(departmentId: string) {
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { leader: { include: { user: true } } },
  });
  return dept?.leader ?? null;
}

export async function toggleEmployeeActive(id: string) {
  const emp = await prisma.employee.findUnique({ where: { id }, select: { isActive: true } });
  if (!emp) throw new Error("Không tìm thấy nhân viên.");
  const updated = await prisma.employee.update({
    where: { id },
    data:  { isActive: !emp.isActive },
  });
  revalidatePath("/admin/employees");
  return updated;
}

export async function updateEmployeeFull(id: string, data: {
  fullName?:     string;
  phone?:        string;
  position?:     string;
  salary?:       number;
  departmentId?: string;
  gender?:       "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?:  Date | null;
  address?:      string;
  joinDate?:     Date;
  isActive?:     boolean;
  role?:         "ADMIN" | "LEADER" | "EMPLOYEE";
}) {
  const emp = await prisma.employee.findUnique({
    where:   { id },
    select:  { userId: true, departmentId: true, leadingDepartment: { select: { id: true } } },
  });
  if (!emp) throw new Error("Không tìm thấy nhân viên.");

  const { role, ...empData } = data;

  // ── Kiểm tra khi đổi role sang LEADER ──────────────────────────────────────
  if (role === "LEADER") {
    // Nhân viên này đã là leader phòng mình rồi thì OK
    const alreadyLeader = !!emp.leadingDepartment;

    if (!alreadyLeader) {
      // Kiểm tra phòng của nhân viên đã có leader chưa
      const dept = await prisma.department.findUnique({
        where:   { id: emp.departmentId },
        include: { leader: { select: { id: true, fullName: true } } },
      });

      if (dept?.leaderId && dept.leaderId !== id) {
        throw new Error(
          `Phòng "${dept.name}" đã có trưởng phòng là "${dept.leader?.fullName}". ` +
          `Vui lòng xóa trưởng phòng cũ trước hoặc dùng trang Phòng ban để gán lại.`
        );
      }

      // Gán nhân viên này làm leader phòng
      await prisma.department.update({
        where: { id: emp.departmentId },
        data:  { leaderId: id },
      });
    }
  }

  // ── Nếu hạ từ LEADER xuống EMPLOYEE → gỡ leaderId khỏi phòng ───────────────
  if (role === "EMPLOYEE" && emp.leadingDepartment) {
    await prisma.department.update({
      where: { id: emp.leadingDepartment.id },
      data:  { leaderId: null },
    });
  }

  // Cập nhật role user
  if (role) {
    await prisma.user.update({ where: { id: emp.userId }, data: { role } });
  }

  const updated = await prisma.employee.update({ where: { id }, data: empData });
  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}`);
  return updated;
}
