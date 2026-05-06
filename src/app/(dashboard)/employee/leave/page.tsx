import { getServerSession }    from "next-auth";
import { authOptions }         from "@/lib/auth";
import { getEmployeeByUserId } from "@/actions/employee.action";
import { getLeavesByEmployee } from "@/actions/leave.action";
import { getOrCreateBalance }  from "@/actions/leave-balance.action";
import { CancelLeaveButton }   from "@/components/forms/CancelLeaveButton";
import Link                    from "next/link";

const TYPE_LABEL: Record<string, string> = {
  ANNUAL:    "Nghỉ phép năm",
  SICK:      "Nghỉ bệnh",
  PERSONAL:  "Việc cá nhân",
  MATERNITY: "Thai sản",
  UNPAID:    "Không lương",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:          { label: "Chờ leader", cls: "badge-yellow" },
  LEADER_APPROVED:  { label: "Chờ HR",     cls: "badge-blue"   },
  APPROVED:         { label: "Đã duyệt",   cls: "badge-green"  },
  REJECTED:         { label: "Từ chối",    cls: "badge-red"    },
  CANCELLED:        { label: "Đã hủy",     cls: "badge-gray"   },
};

export default async function EmployeeLeavePage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);
  if (!employee) return null;

  const year    = new Date().getFullYear();
  const [leaves, balance] = await Promise.all([
    getLeavesByEmployee(employee.id),
    getOrCreateBalance(employee.id, year),
  ]);

  const pct = Math.round((balance.usedDays / balance.totalDays) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Đơn nghỉ phép</h1>
        <Link href="/employee/leave/new" className="btn-primary">+ Gửi đơn mới</Link>
      </div>

      {/* Balance card */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Ngày phép năm {year}</h2>
          <span className={`text-sm font-bold ${balance.remainingDays <= 2 ? "text-red-600" : "text-green-600"}`}>
            Còn {balance.remainingDays} ngày
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-gray-400 text-xs">Tổng được cấp</p>
            <p className="font-bold text-gray-900 text-lg">{balance.totalDays}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Đã sử dụng</p>
            <p className="font-bold text-yellow-600 text-lg">{balance.usedDays}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Còn lại</p>
            <p className={`font-bold text-lg ${balance.remainingDays <= 2 ? "text-red-600" : "text-green-600"}`}>
              {balance.remainingDays}
            </p>
          </div>
        </div>

        {balance.remainingDays === 0 && (
          <p className="text-xs text-red-500 mt-3 text-center">
            ⚠️ Bạn đã hết ngày phép năm. Chỉ có thể xin nghỉ bệnh, việc cá nhân hoặc không lương.
          </p>
        )}
      </div>

      {/* Leave list */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Loại</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Từ ngày</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Đến ngày</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Số ngày</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Lý do</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Trạng thái</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leaves.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Chưa có đơn nghỉ phép nào</td></tr>
            ) : leaves.map((l) => {
              const s = STATUS_CONFIG[l.status];
              return (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-700">{TYPE_LABEL[l.type]}</td>
                  <td className="px-5 py-3 text-gray-600">{new Date(l.startDate).toLocaleDateString("vi-VN")}</td>
                  <td className="px-5 py-3 text-gray-600">{new Date(l.endDate).toLocaleDateString("vi-VN")}</td>
                  <td className="px-5 py-3 font-medium text-blue-600">{l.totalDays} ngày</td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{l.reason}</td>
                  <td className="px-5 py-3">
                    <span className={s.cls}>{s.label}</span>
                    {l.status === "REJECTED" && l.leaderNote && (
                      <p className="text-xs text-red-500 mt-1">Leader: {l.leaderNote}</p>
                    )}
                    {l.status === "REJECTED" && l.hrNote && (
                      <p className="text-xs text-red-500 mt-1">HR: {l.hrNote}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {l.status === "PENDING" && (
                      <CancelLeaveButton id={l.id} employeeId={employee.id} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
