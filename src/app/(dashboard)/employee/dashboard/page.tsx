import { getServerSession }        from "next-auth";
import { authOptions }             from "@/lib/auth";
import { getEmployeeByUserId }     from "@/actions/employee.action";
import { getMonthlyStats }         from "@/actions/attendance.action";
import { getLeavesByEmployee }     from "@/actions/leave.action";
import { getTodayAttendance }      from "@/actions/attendance.action";
import { getHolidays }             from "@/actions/holiday.action";
import { AttendanceCalendar }      from "@/components/ui/AttendanceCalendar";
import { AttendanceActions }       from "@/components/forms/AttendanceActions";
import { formatCurrency }          from "@/lib/utils";
import Link                        from "next/link";

export default async function EmployeeDashboardPage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);

  if (!employee) {
    return <div className="card p-12 text-center text-gray-400">Không tìm thấy thông tin nhân viên.</div>;
  }

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const [stats, leaves, todayAtt, holidayList] = await Promise.all([
    getMonthlyStats(employee.id, month, year),
    getLeavesByEmployee(employee.id),
    getTodayAttendance(employee.id),
    getHolidays(year),
  ]);

  const holidayDates = holidayList.map(h =>
    new Date(h.date).toISOString().split("T")[0]
  );

  const pendingLeaves  = leaves.filter((l) => l.status === "PENDING").length;
  const approvedLeaves = leaves.filter((l) => l.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {employee.fullName.split(" ").slice(-1)[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
        </div>
        <Link href="/employee/leave/new" className="btn-primary text-sm">
          + Xin nghỉ phép
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar + Check-in */}
        <div className="lg:col-span-2 space-y-4">
          {/* Attendance calendar */}
          <div className="card p-5">
            <AttendanceCalendar
              records={stats.records}
              month={month}
              year={year}
              holidays={holidayDates}
            />
          </div>

          {/* Today check-in/out */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Chấm công hôm nay</h2>
            <AttendanceActions employeeId={employee.id} todayAtt={todayAtt} />
          </div>
        </div>

        {/* Right: Stats + Info */}
        <div className="space-y-4">
          {/* Monthly stats */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Thống kê tháng {month}</h2>
            <div className="space-y-3">
              {[
                { label: "Có mặt",    value: stats.present,  color: "text-green-600",  bg: "bg-green-100"  },
                { label: "Đi trễ",    value: stats.late,     color: "text-yellow-600", bg: "bg-yellow-100" },
                { label: "Vắng",      value: stats.absent,   color: "text-red-600",    bg: "bg-red-100"    },
                { label: "Nghỉ phép", value: stats.leave,    color: "text-purple-600", bg: "bg-purple-100" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{s.label}</span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                    {s.value} ngày
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Leave status */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Nghỉ phép</h2>
              <Link href="/employee/leave" className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Chờ duyệt</span>
                <span className="font-semibold text-yellow-600">{pendingLeaves}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đã duyệt</span>
                <span className="font-semibold text-green-600">{approvedLeaves}</span>
              </div>
            </div>
            <Link href="/employee/leave/new" className="btn-secondary w-full mt-3 text-xs">
              + Gửi đơn nghỉ phép
            </Link>
          </div>

          {/* Employee info */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Thông tin</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Mã NV</span>
                <span className="font-mono font-medium">{employee.employeeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phòng ban</span>
                <span className="font-medium">{employee.department.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Chức vụ</span>
                <span className="font-medium">{employee.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lương</span>
                <span className="font-medium text-green-600">{formatCurrency(employee.salary)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
