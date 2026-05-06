import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import * as XLSX                     from "xlsx";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const dept   = searchParams.get("dept")   || undefined;
  const status = searchParams.get("status") || undefined;

  const employees = await prisma.employee.findMany({
    where: {
      ...(dept   ? { departmentId: dept }             : {}),
      ...(status ? { isActive: status === "active" }  : {}),
    },
    include: {
      department: true,
      user:       { select: { email: true, role: true } },
    },
    orderBy: [{ departmentId: "asc" }, { fullName: "asc" }],
  });

  const rows = employees.map((emp, i) => ({
    "STT":           i + 1,
    "Mã NV":         emp.employeeCode,
    "Họ và tên":     emp.fullName,
    "Email":         emp.user.email,
    "SĐT":           emp.phone ?? "",
    "Giới tính":     emp.gender === "MALE" ? "Nam" : emp.gender === "FEMALE" ? "Nữ" : "Khác",
    "Ngày sinh":     emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString("vi-VN") : "",
    "Địa chỉ":       emp.address ?? "",
    "Phòng ban":     emp.department.name,
    "Chức vụ":       emp.position,
    "Vai trò":       emp.user.role === "LEADER" ? "Trưởng phòng" : "Nhân viên",
    "Lương CB":      emp.salary,
    "Ngày vào làm":  new Date(emp.joinDate).toLocaleDateString("vi-VN"),
    "Trạng thái":    emp.isActive ? "Đang làm việc" : "Nghỉ việc",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    {wch:5},{wch:12},{wch:22},{wch:28},{wch:14},
    {wch:8},{wch:12},{wch:30},{wch:20},{wch:25},
    {wch:14},{wch:14},{wch:14},{wch:14},
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nhân viên");

  const buf      = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `nhan_vien_${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
