import { getServerSession }                    from "next-auth";
import { authOptions }                         from "@/lib/auth";
import { getEmployeeByUserId }                 from "@/actions/employee.action";
import { getPendingLeavesForLeader }           from "@/actions/leave.action";
import { getPendingCorrectionsForLeader }      from "@/actions/correction.action";
import { getLeaderApprovedLeaves, getAllLeavesForHR } from "@/actions/leave.action";
import { getLeaderApprovedCorrections }        from "@/actions/correction.action";
import Link                                    from "next/link";

export default async function LeaderDashboardPage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);
  if (!employee) return null;

  const isHR        = employee.department.isHR;
  const departmentId = employee.departmentId;

  // Tuỳ theo là leader HR hay leader thường
  const [pendingLeaves, pendingCorrections, hrPendingLeaves, hrPendingCorrections] =
    await Promise.all([
      isHR ? Promise.resolve([]) : getPendingLeavesForLeader(departmentId),
      isHR ? Promise.resolve([]) : getPendingCorrectionsForLeader(departmentId),
      isHR ? getLeaderApprovedLeaves()      : Promise.resolve([]),
      isHR ? getLeaderApprovedCorrections() : Promise.resolve([]),
    ]);

  const awaitingMe = isHR
    ? hrPendingLeaves.length + hrPendingCorrections.length
    : pendingLeaves.length  + pendingCorrections.length;

  const stats = [
    {
      label: isHR ? "Đơn nghỉ phép chờ HR duyệt" : "Đơn nghỉ phép chờ duyệt",
      value: isHR ? hrPendingLeaves.length : pendingLeaves.length,
      href:  "/leader/leave",
      color: "text-yellow-600", bg: "bg-yellow-50",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
    {
      label: isHR ? "Đơn bổ sung công chờ HR duyệt" : "Đơn bổ sung công chờ duyệt",
      value: isHR ? hrPendingCorrections.length : pendingCorrections.length,
      href:  "/leader/correction",
      color: "text-blue-600", bg: "bg-blue-50",
      icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {employee.fullName.split(" ").slice(-1)[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Trưởng phòng · {employee.department.name}
          {isHR && <span className="ml-2 badge-green">Phòng Nhân sự</span>}
        </p>
      </div>

      {awaitingMe > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            Có <strong>{awaitingMe} đơn</strong> đang chờ bạn phê duyệt.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((s) => (
          <Link key={s.href} href={s.href}
            className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center flex-shrink-0`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-3xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Hướng dẫn luồng duyệt */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Luồng phê duyệt</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <span className="badge-blue">Nhân viên gửi đơn</span>
          <span>→</span>
          <span className={`badge ${isHR ? "badge-gray line-through opacity-50" : "badge-yellow"}`}>
            Leader phòng duyệt vòng 1
          </span>
          <span>→</span>
          <span className={`badge ${isHR ? "badge-yellow" : "badge-gray opacity-50"}`}>
            HR xác nhận vòng 2
          </span>
          <span>→</span>
          <span className="badge-green">Có hiệu lực</span>
        </div>
        {isHR
          ? <p className="text-xs text-gray-400 mt-2">Bạn xử lý <strong>vòng 2</strong> — xác nhận đơn đã qua leader phòng duyệt.</p>
          : <p className="text-xs text-gray-400 mt-2">Bạn xử lý <strong>vòng 1</strong> — sau khi bạn duyệt, đơn sẽ chuyển đến phòng Nhân sự.</p>
        }
      </div>
    </div>
  );
}
