import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { getAllPayroll, getDepartmentPayroll } from "@/actions/payroll.action";
import { getEmployeeByUserId }       from "@/actions/employee.action";
import * as XLSX                     from "xlsx";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN","LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const now   = new Date(Date.now() + 7 * 3600000);
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;
  const year  = Number(searchParams.get("year"))  || now.getUTCFullYear();

  let records;
  if (session.user.role === "ADMIN") {
    records = await getAllPayroll(month, year);
  } else {
    const me = await getEmployeeByUserId(session.user.id);
    if (!me) return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    records = await getDepartmentPayroll(me.departmentId, month, year);
  }

  const rows = records.map((r, i) => ({
    "STT":            i + 1,
    "Mã NV":          r.employeeCode,
    "Họ và tên":      r.fullName,
    "Phòng ban":      r.department,
    "Chức vụ":        r.position,
    "Lương CB (VNĐ)": r.baseSalary,
    "Ngày làm việc":  r.workDaysTotal,
    "Ngày có mặt":    r.presentDays,
    "Ngày đi trễ":    r.lateDays,
    "Ngày nghỉ phép": r.leaveDays,
    "Ngày vắng":      r.absentDays,
    "KT đi trễ":      r.lateDeduction,
    "KT vắng":        r.absentDeduction,
    "Tổng KT":        r.lateDeduction + r.absentDeduction,
    "Thực nhận (VNĐ)":r.grossSalary,
  }));

  const MONTH_NAMES = ["","T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    {wch:5},{wch:12},{wch:22},{wch:20},{wch:24},
    {wch:16},{wch:14},{wch:14},{wch:14},{wch:16},
    {wch:12},{wch:14},{wch:12},{wch:12},{wch:16},
  ];

  const wb       = XLSX.utils.book_new();
  const sheetName = `Lương ${MONTH_NAMES[month]}.${year}`;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const buf      = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `bang_luong_${MONTH_NAMES[month]}_${year}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
