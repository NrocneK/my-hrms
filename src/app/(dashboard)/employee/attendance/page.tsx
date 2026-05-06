import { getServerSession }    from "next-auth";
import { authOptions }         from "@/lib/auth";
import { getEmployeeByUserId } from "@/actions/employee.action";
import { getMonthlyStats, getTodayAttendance } from "@/actions/attendance.action";
import { AttendanceActions }   from "@/components/forms/AttendanceActions";
import { AttendanceCalendar }  from "@/components/ui/AttendanceCalendar";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PRESENT:  { label: "Có mặt",    cls: "badge-green"  },
  LATE:     { label: "Đi trễ",    cls: "badge-yellow" },
  ABSENT:   { label: "Vắng",      cls: "badge-red"    },
  HALF_DAY: { label: "Nửa ngày",  cls: "badge-blue"   },
  LEAVE:    { label: "Nghỉ phép", cls: "badge-gray"   },
};

function fmtTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function calcHours(checkIn: Date | null, checkOut: Date | null) {
  if (!checkIn || !checkOut) return "—";
  const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000;
  return `${diff.toFixed(1)}h`;
}

export default async function AttendancePage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);

  if (!employee) return <div className="card p-12 text-center text-gray-400">Không tìm thấy nhân viên.</div>;

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const [stats, todayAtt] = await Promise.all([
    getMonthlyStats(employee.id, month, year),
    getTodayAttendance(employee.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Chấm công</h1>

      {/* Today card - full width, prominent */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Hôm nay — {now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
        </h2>
        <AttendanceActions employeeId={employee.id} todayAtt={todayAtt} />
      </div>

      {/* Stats + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-5">
          <AttendanceCalendar records={stats.records} month={month} year={year} />
        </div>

        {/* Monthly summary */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tháng {month}/{year}</h2>
          <div className="space-y-3">
            {[
              { label: "Có mặt",    val: stats.present, color: "text-green-600",  bar: "bg-green-500"  },
              { label: "Đi trễ",    val: stats.late,    color: "text-yellow-600", bar: "bg-yellow-500" },
              { label: "Vắng",      val: stats.absent,  color: "text-red-600",    bar: "bg-red-500"    },
              { label: "Nghỉ phép", val: stats.leave,   color: "text-purple-600", bar: "bg-purple-500" },
            ].map((s) => {
              const total = stats.records.length || 1;
              const pct   = Math.round((s.val / total) * 100);
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{s.label}</span>
                    <span className={`font-semibold ${s.color}`}>{s.val} ngày</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Lịch sử tháng {month}/{year}</h2>
          <span className="text-xs text-gray-400">{stats.records.length} bản ghi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Ngày</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Check-IN</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Check-OUT</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Số giờ</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.records.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Chưa có dữ liệu</td></tr>
              ) : (
                [...stats.records].reverse().map((r) => {
                  const s = STATUS_LABEL[r.status] ?? { label: r.status, cls: "badge-gray" };
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-700">
                        {new Date(r.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={r.checkIn ? "text-green-600 font-semibold" : "text-gray-300"}>
                          {fmtTime(r.checkIn)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={r.checkOut ? "text-blue-600 font-semibold" : "text-gray-300"}>
                          {fmtTime(r.checkOut)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{calcHours(r.checkIn, r.checkOut)}</td>
                      <td className="px-5 py-3"><span className={s.cls}>{s.label}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
