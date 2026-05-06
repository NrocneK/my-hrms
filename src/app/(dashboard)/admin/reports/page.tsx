import {
  getCompanyOverview,
  getAttendanceTrend,
  getDepartmentAttendanceStats,
  getTopAbsentEmployees,
} from "@/actions/report.action";
import { formatCurrency } from "@/lib/utils";
import {
  AttendanceTrendChart,
  DepartmentRateChart,
  AttendancePieChart,
} from "@/components/ui/Charts";
import { ExportButton } from "@/components/ui/ExportButton";

const MONTH_NAMES = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                        "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export default async function AdminReportsPage() {
  const [overview, trend, deptStats, topAbsent] = await Promise.all([
    getCompanyOverview(),
    getAttendanceTrend(),
    getDepartmentAttendanceStats(),
    getTopAbsentEmployees(5),
  ]);

  const pieData = [
    { name: "Có mặt",    value: overview.thisMonth.present, color: "#22c55e" },
    { name: "Đi trễ",    value: overview.thisMonth.late,    color: "#eab308" },
    { name: "Nghỉ phép", value: overview.thisMonth.leave,   color: "#a855f7" },
    { name: "Vắng",      value: overview.thisMonth.absent,  color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
          <p className="text-sm text-gray-400 mt-1">
            {MONTH_NAMES[overview.month]} {overview.year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            href={`/api/export/attendance?month=${overview.month}&year=${overview.year}`}
            label="Xuất chấm công"
          />
          <ExportButton
            href={`/api/export/payroll?month=${overview.month}&year=${overview.year}`}
            label="Xuất bảng lương"
            variant="primary"
          />
        </div>
      </div>

      {/* KPI tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Nhân viên",      value: overview.totalEmp,            color: "text-gray-900",  bg: "bg-white"     },
          { label: "Phòng ban",      value: overview.totalDept,           color: "text-gray-900",  bg: "bg-white"     },
          { label: "Trưởng phòng",   value: overview.totalLeader,         color: "text-blue-700",  bg: "bg-blue-50"   },
          { label: "Đơn chờ duyệt",  value: overview.pendingLeaves + overview.pendingCorrections,
                                                                          color: "text-amber-700", bg: "bg-amber-50"  },
          { label: "Vắng tháng này", value: overview.thisMonth.absent,    color: "text-red-700",   bg: "bg-red-50"    },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Row 2: Trend + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend 6 tháng */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Xu hướng chấm công 6 tháng</h2>
          <AttendanceTrendChart data={trend} />
        </div>

        {/* Pie tháng hiện tại */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-1">
            Phân bổ tháng {overview.month}
          </h2>
          {pieData.length > 0 ? (
            <>
              <AttendancePieChart data={pieData} />
              <div className="space-y-1.5 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-gray-400 text-sm">Chưa có dữ liệu tháng này</div>
          )}
        </div>
      </div>

      {/* Row 3: Dept rate + Top absent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tỷ lệ theo phòng */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Tỷ lệ có mặt theo phòng ban — {MONTH_NAMES[overview.month]}
          </h2>
          {deptStats.length > 0 ? (
            <DepartmentRateChart data={deptStats} />
          ) : (
            <div className="py-16 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Top vắng/trễ */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Top vắng/trễ tháng {overview.month}
          </h2>
          {topAbsent.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Không có nhân viên vắng/trễ 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {topAbsent.map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${i === 0 ? "bg-red-100 text-red-700" : i === 1 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{emp.fullName}</p>
                    <p className="text-xs text-gray-400">{emp.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {emp.absent > 0 && (
                      <span className="badge-red text-xs mr-1">{emp.absent} vắng</span>
                    )}
                    {emp.late > 0 && (
                      <span className="badge-yellow text-xs">{emp.late} trễ</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bảng chi tiết theo phòng */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Chi tiết chấm công theo phòng ban — {MONTH_NAMES[overview.month]} {overview.year}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Phòng ban","NV","Có mặt","Đi trễ","Nghỉ phép","Vắng","Tỷ lệ có mặt"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deptStats.map(d => (
                <tr key={d.name} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{d.name}</td>
                  <td className="px-5 py-3 text-gray-500">{d.empCount}</td>
                  <td className="px-5 py-3 text-green-600  font-medium">{d.present}</td>
                  <td className="px-5 py-3 text-yellow-600 font-medium">{d.late}</td>
                  <td className="px-5 py-3 text-purple-600 font-medium">{d.leave}</td>
                  <td className="px-5 py-3 text-red-600    font-medium">{d.absent}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.rate >= 90 ? "bg-green-500" : d.rate >= 75 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${d.rate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold whitespace-nowrap
                        ${d.rate >= 90 ? "text-green-600" : d.rate >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                        {d.rate}%
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
