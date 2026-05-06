import { getPayrollSummary } from "@/actions/payroll.action";
import { formatCurrency }    from "@/lib/utils";
import { MonthPicker }       from "@/components/ui/MonthPicker";
import { ExportButton }      from "@/components/ui/ExportButton";

const MONTH_NAMES = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                        "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export default async function AdminPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp    = await searchParams;
  const now   = new Date(Date.now() + 7 * 3600000);
  const month = Number(sp.month) || now.getUTCMonth() + 1;
  const year  = Number(sp.year)  || now.getUTCFullYear();

  const { records, totalGross, totalBase, totalDeduct, totalAbsent, totalLate } =
    await getPayrollSummary(month, year);

  const byDept = records.reduce<Record<string, typeof records>>((acc, r) => {
    acc[r.department] = acc[r.department] ?? [];
    acc[r.department].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Bảng lương toàn công ty</h1>
        <div className="flex items-center gap-2">
          <ExportButton href={`/api/export/payroll?month=${month}&year=${year}`} label="Xuất Excel" />
          <MonthPicker currentMonth={month} currentYear={year} />
        </div>
      </div>

      {/* KPI cards */}
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

      {/* Cảnh báo */}
      {(totalAbsent > 0 || totalLate > 0) && (
        <div className="card p-4 bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800">
            ⚠️ Tháng này: <strong>{totalAbsent} ngày vắng</strong> và{" "}
            <strong>{totalLate} lần đi trễ</strong> trên toàn công ty.
          </p>
        </div>
      )}

      {/* Bảng theo phòng ban */}
      {Object.entries(byDept).map(([deptName, emps]) => {
        const deptTotal = emps.reduce((s, r) => s + r.grossSalary, 0);
        return (
          <div key={deptName} className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{deptName}</h2>
              <span className="text-sm text-gray-500">
                {emps.length} NV ·{" "}
                <span className="font-semibold text-green-700">{formatCurrency(deptTotal)}</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Nhân viên","Lương CB","Có mặt","Trễ","Phép","Vắng","Khấu trừ","Thực nhận"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-400 text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {emps.map(r => (
                    <tr key={r.employeeId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.fullName}</p>
                        <p className="text-xs text-gray-400">{r.employeeCode}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatCurrency(r.baseSalary)}</td>
                      <td className="px-4 py-3 text-green-600  font-medium">{r.presentDays}</td>
                      <td className="px-4 py-3 text-yellow-600 font-medium">{r.lateDays}</td>
                      <td className="px-4 py-3 text-blue-600   font-medium">{r.leaveDays}</td>
                      <td className="px-4 py-3 text-red-600    font-medium">{r.absentDays}</td>
                      <td className="px-4 py-3 text-red-500 text-xs">
                        {(r.lateDeduction + r.absentDeduction) > 0
                          ? `- ${formatCurrency(r.lateDeduction + r.absentDeduction)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {formatCurrency(r.grossSalary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {records.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          Chưa có dữ liệu lương tháng {MONTH_NAMES[month]} {year}
        </div>
      )}
    </div>
  );
}
