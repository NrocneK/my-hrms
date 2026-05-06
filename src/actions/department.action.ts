"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { employees: true } },
      leader: true,
    },
  });
}

export async function getDepartmentById(id: string) {
  return prisma.department.findUnique({
    where: { id },
    include: { leader: true },
  });
}

export async function getHRDepartment() {
  return prisma.department.findFirst({ where: { isHR: true } });
}

export async function createDepartment(data: {
  name: string;
  description?: string;
  isHR?: boolean;
}) {
  const dept = await prisma.department.create({ data });
  revalidatePath("/admin/departments");
  return dept;
}

export async function updateDepartment(
  id: string,
  data: { name?: string; description?: string; isHR?: boolean; leaderId?: string | null }
) {
  // Nếu gán leader mới → cập nhật role của user đó thành LEADER
  if (data.leaderId) {
    const employee = await prisma.employee.findUnique({
      where: { id: data.leaderId },
      select: { userId: true },
    });
    if (employee) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { role: "LEADER" },
      });
    }
  }

  // Nếu xóa leader → hạ role về EMPLOYEE
  if (data.leaderId === null) {
    const dept = await prisma.department.findUnique({ where: { id } });
    if (dept?.leaderId) {
      const oldLeader = await prisma.employee.findUnique({
        where: { id: dept.leaderId },
        select: { userId: true },
      });
      if (oldLeader) {
        await prisma.user.update({
          where: { id: oldLeader.userId },
          data: { role: "EMPLOYEE" },
        });
      }
    }
  }

  const dept = await prisma.department.update({ where: { id }, data });
  revalidatePath("/admin/departments");
  return dept;
}

export async function deleteDepartment(id: string) {
  await prisma.department.delete({ where: { id } });
  revalidatePath("/admin/departments");
}
