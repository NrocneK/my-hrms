import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { getEmployeeByUserId }       from "@/actions/employee.action";
import {
  getAttendanceTrend,
  getDepartmentDetailReport,
  getTopAbsentEmployees,
} from "@/actions/report.action";
import { AttendanceTrendChart }      from "@/components/ui/Charts";

const MONTH_NAMES = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                        "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export default async function LeaderReportsPage({
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

  const [trend, detail, topAbsent] = await Promise.all([
    getAttendanceTrend(me.departmentId),
    getDepartmentDetailReport(me.departmentId, month, year),
    getTopAbsentEmployees(5, me.departmentId),
  ]);

  const totalPresent = detail.reduce((s, e) => s + e.present, 0);
  const totalLate    = detail.reduce((s, e) => s + e.late,    0);
  const totalAbsent  = detail.reduce((s, e) => s + e.absent,  0);
  const totalLeave   = detail.reduce((s, e) => s + e.leave,   0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo phòng</h1>
          <p className="text-sm text-gray-400 mt-0.5">{me.department.name}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {MONTH_NAMES[month]} {year}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Có mặt",    value: totalPresent, color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Đi trễ",    value: totalLate,    color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Nghỉ phép", value: totalLeave,   color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Vắng",      value: totalAbsent,  color: "text-red-600",    bg: "bg-red-50"    },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Trend + Top absent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Xu hướng 6 tháng gần nhất</h2>
          <AttendanceTrendChart data={trend} />
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Vắng/Trễ nhiều nhất</h2>
          {topAbsent.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Không có nhân viên vắng/trễ 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {topAbsent.map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${i === 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.fullName}</p>
                  </div>
                  <div className="flex-shrink-0 flex gap-1">
                    {emp.absent > 0 && <span className="badge-red text-xs">{emp.absent}V</span>}
                    {emp.late   > 0 && <span className="badge-yellow text-xs">{emp.late}T</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chi tiết từng nhân viên */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Chi tiết nhân viên — {MONTH_NAMES[month]} {year}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Nhân viên","Ngày làm","Có mặt","Trễ","Phép","Vắng","Tỷ lệ"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {detail.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chưa có dữ liệu</td></tr>
              ) : detail.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{e.fullName}</p>
                    <p className="text-xs text-gray-400">{e.position}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{e.workDays}</td>
                  <td className="px-5 py-3 text-green-600  font-medium">{e.present}</td>
                  <td className="px-5 py-3 text-yellow-600 font-medium">{e.late}</td>
                  <td className="px-5 py-3 text-purple-600 font-medium">{e.leave}</td>
                  <td className="px-5 py-3 text-red-600    font-medium">{e.absent}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${e.rate >= 90 ? "bg-green-500" : e.rate >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${e.rate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold
                        ${e.rate >= 90 ? "text-green-600" : e.rate >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                        {e.rate}%
                      </span>
                    </div>
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
