import { getServerSession }     from "next-auth";
import { authOptions }          from "@/lib/auth";
import { getEmployeeByUserId }  from "@/actions/employee.action";
import { getDepartmentPayroll } from "@/actions/payroll.action";
import { formatCurrency }       from "@/lib/utils";
import { MonthPicker }          from "@/components/ui/MonthPicker";
import { ExportButton }         from "@/components/ui/ExportButton";

const MONTH_NAMES = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                        "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export default async function LeaderPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp      = await searchParams;
  const session = await getServerSession(authOptions);
  const me      = await getEmployeeByUserId(session!.user.id);
  if (!me) return null;

  const now   = new Date(Date.now() + 7 * 3600000);
  const month = Number(sp.month) || now.getUTCMonth() + 1;
  const year  = Number(sp.year)  || now.getUTCFullYear();

  const records    = await getDepartmentPayroll(me.departmentId, month, year);
  const totalGross = records.reduce((s, r) => s + r.grossSalary, 0);
  const totalBase  = records.reduce((s, r) => s + r.baseSalary,  0);
  const totalDeduct = records.reduce((s, r) => s + r.lateDeduction + r.absentDeduction, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng lương phòng</h1>
          <p className="text-sm text-gray-400 mt-0.5">{me.department.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton href={`/api/export/payroll?month=${month}&year=${year}`} label="Xuất Excel" />
          <MonthPicker currentMonth={month} currentYear={year} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tổng nhân viên", value: `${records.length} người`, bg: "bg-white",    text: "text-gray-900"  },
          { label: "Quỹ lương CB",   value: formatCurrency(totalBase),  bg: "bg-white",    text: "text-gray-700"  },
          { label: "Tổng khấu trừ", value: formatCurrency(totalDeduct), bg: "bg-red-50",   text: "text-red-700"   },
          { label: "Tổng thực chi",  value: formatCurrency(totalGross),  bg: "bg-green-50", text: "text-green-700" },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Chi tiết — {MONTH_NAMES[month]} {year}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Nhân viên","Lương CB","Có mặt","Trễ","Phép","Vắng","Khấu trừ","Thực nhận"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    Chưa có dữ liệu tháng {MONTH_NAMES[month]} {year}
                  </td>
                </tr>
              ) : records.map(r => (
                <tr key={r.employeeId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.fullName}</p>
                    <p className="text-xs text-gray-400">{r.position}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(r.baseSalary)}</td>
                  <td className="px-4 py-3 text-green-600  font-medium">{r.presentDays}</td>
                  <td className="px-4 py-3 text-yellow-600 font-medium">{r.lateDays}</td>
                  <td className="px-4 py-3 text-blue-600   font-medium">{r.leaveDays}</td>
                  <td className="px-4 py-3 text-red-600    font-medium">{r.absentDays}</td>
                  <td className="px-4 py-3 text-red-500 text-xs">
                    {(r.lateDeduction + r.absentDeduction) > 0
                      ? `- ${formatCurrency(r.lateDeduction + r.absentDeduction)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(r.grossSalary)}</td>
                </tr>
              ))}
            </tbody>
            {records.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={7} className="px-4 py-3 font-semibold text-gray-700">Tổng cộng</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(totalGross)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
