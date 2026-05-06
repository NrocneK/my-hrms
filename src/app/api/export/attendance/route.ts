import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { getEmployeeByUserId }       from "@/actions/employee.action";
import * as XLSX                     from "xlsx";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const STATUS_LABEL: Record<string, string> = {
  PRESENT:  "Có mặt",
  LATE:     "Đi trễ",
  ABSENT:   "Vắng",
  HALF_DAY: "Nửa ngày",
  LEAVE:    "Nghỉ phép",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN","LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const now   = new Date(Date.now() + VN_OFFSET_MS);
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;
  const year  = Number(searchParams.get("year"))  || now.getUTCFullYear();

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  // Lọc theo phòng nếu là leader
  let deptFilter: string | undefined;
  if (session.user.role === "LEADER") {
    const me = await getEmployeeByUserId(session.user.id);
    deptFilter = me?.departmentId;
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(deptFilter ? { employee: { departmentId: deptFilter } } : {}),
    },
    include: {
      employee: { include: { department: true } },
    },
    orderBy: [
      { employee: { departmentId: "asc" } },
      { employee: { fullName: "asc" } },
      { date: "asc" },
    ],
  });

  function fmtTime(d: Date | null) {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  const rows = attendances.map((a, i) => ({
    "STT":          i + 1,
    "Mã NV":        a.employee.employeeCode,
    "Họ và tên":    a.employee.fullName,
    "Phòng ban":    a.employee.department.name,
    "Ngày":         new Date(a.date).toLocaleDateString("vi-VN"),
    "Check-IN":     fmtTime(a.checkIn),
    "Check-OUT":    fmtTime(a.checkOut),
    "Trạng thái":   STATUS_LABEL[a.status] ?? a.status,
    "Ghi chú":      a.note ?? "",
  }));

  const MONTH_NAMES = ["","T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    {wch:5},{wch:12},{wch:22},{wch:20},
    {wch:12},{wch:10},{wch:10},{wch:12},{wch:20},
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Chấm công ${MONTH_NAMES[month]}.${year}`);

  const buf      = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `cham_cong_${MONTH_NAMES[month]}_${year}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
