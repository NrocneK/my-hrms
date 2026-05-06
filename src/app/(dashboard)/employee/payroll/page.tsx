import { getServerSession }    from "next-auth";
import { authOptions }         from "@/lib/auth";
import { getEmployeeByUserId } from "@/actions/employee.action";
import { getMyPayroll }        from "@/actions/payroll.action";
import { formatCurrency }      from "@/lib/utils";

const MONTH_NAMES = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                        "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export default async function EmployeePayrollPage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);
  if (!employee) return null;

  const records = await getMyPayroll(employee.id);
  const latest  = records[0]; // tháng hiện tại

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bảng lương</h1>

      {/* Tháng hiện tại — nổi bật */}
      {latest && (
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-blue-600 font-medium">
                {MONTH_NAMES[latest.month]} {latest.year}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(latest.grossSalary)}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Lương cơ bản: {formatCurrency(latest.baseSalary)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Ngày công</p>
              <p className="text-2xl font-bold text-blue-600">
                {latest.workDaysActual}
                <span className="text-sm font-normal text-gray-400">/{latest.workDaysTotal}</span>
              </p>
            </div>
          </div>

          {/* Chi tiết ngày công */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Có mặt",    value: latest.presentDays, color: "text-green-600",  bg: "bg-green-50"  },
              { label: "Đi trễ",    value: latest.lateDays,    color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Nghỉ phép", value: latest.leaveDays,   color: "text-blue-600",   bg: "bg-blue-50"   },
              { label: "Vắng",      value: latest.absentDays,  color: "text-red-600",    bg: "bg-red-50"    },
            ].map(s => (
              <div key={s.label} className={`rounded-lg px-3 py-2 ${s.bg}`}>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value} ngày</p>
              </div>
            ))}
          </div>

          {/* Khấu trừ */}
          {(latest.lateDeduction > 0 || latest.absentDeduction > 0) && (
            <div className="mt-4 pt-4 border-t border-blue-200 space-y-1.5">
              <p className="text-xs font-medium text-gray-500 mb-2">Khấu trừ:</p>
              {latest.lateDeduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Đi trễ ({latest.lateDays} lần × 0.5 ngày)</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(latest.lateDeduction)}</span>
                </div>
              )}
              {latest.absentDeduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vắng ({latest.absentDays} ngày)</span>
                  <span className="text-red-600 font-medium">- {formatCurrency(latest.absentDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold pt-1 border-t border-blue-200">
                <span className="text-gray-700">Thực nhận</span>
                <span className="text-blue-700">{formatCurrency(latest.grossSalary)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lịch sử 6 tháng */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Lịch sử 6 tháng gần nhất</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Tháng","Lương CB","Ngày công","Có mặt","Trễ","Phép","Vắng","Khấu trừ","Thực nhận"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r, i) => (
                <tr key={`${r.month}-${r.year}`}
                  className={`hover:bg-gray-50 ${i === 0 ? "bg-blue-50/40 font-medium" : ""}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {MONTH_NAMES[r.month]} {r.year}
                    {i === 0 && <span className="ml-1 badge-blue text-xs">Hiện tại</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(r.baseSalary)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{r.workDaysActual}</span>
                    <span className="text-gray-400">/{r.workDaysTotal}</span>
                  </td>
                  <td className="px-4 py-3 text-green-600">{r.presentDays}</td>
                  <td className="px-4 py-3 text-yellow-600">{r.lateDays}</td>
                  <td className="px-4 py-3 text-blue-600">{r.leaveDays}</td>
                  <td className="px-4 py-3 text-red-600">{r.absentDays}</td>
                  <td className="px-4 py-3 text-red-500">
                    {(r.lateDeduction + r.absentDeduction) > 0
                      ? `- ${formatCurrency(r.lateDeduction + r.absentDeduction)}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatCurrency(r.grossSalary)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
