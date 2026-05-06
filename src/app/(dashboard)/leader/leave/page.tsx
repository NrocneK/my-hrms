import { getServerSession }                from "next-auth";
import { authOptions }                     from "@/lib/auth";
import { getEmployeeByUserId }             from "@/actions/employee.action";
import {
  getPendingLeavesForLeader,
  getLeaderApprovedLeaves,
  getAllLeavesForHR,
} from "@/actions/leave.action";
import { ApprovalButtons } from "@/components/forms/ApprovalButtons";

const TYPE_LABEL: Record<string, string> = {
  ANNUAL: "Phép năm", SICK: "Nghỉ bệnh", PERSONAL: "Cá nhân",
  MATERNITY: "Thai sản", UNPAID: "Không lương",
};
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:          { label: "Chờ leader", cls: "badge-yellow" },
  LEADER_APPROVED:  { label: "Chờ HR",     cls: "badge-blue"   },
  APPROVED:         { label: "Đã duyệt",   cls: "badge-green"  },
  REJECTED:         { label: "Từ chối",    cls: "badge-red"    },
  CANCELLED:        { label: "Đã hủy",     cls: "badge-gray"   },
};

function LeaveRow({ leave, round }: { leave: any; round?: "leader" | "hr" }) {
  const s = STATUS_CFG[leave.status];
  return (
    <div className="px-5 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900">{leave.employee.fullName}</p>
            <span className="text-xs text-gray-400">{leave.employee.employeeCode}</span>
            <span className="badge-gray text-xs">{leave.employee.department.name}</span>
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{TYPE_LABEL[leave.type]}</span>
            {" · "}
            {new Date(leave.startDate).toLocaleDateString("vi-VN")} –{" "}
            {new Date(leave.endDate).toLocaleDateString("vi-VN")}
            {" · "}
            <span className="font-semibold text-blue-600">{leave.totalDays} ngày</span>
          </p>
          <p className="text-xs text-gray-400 truncate max-w-md">Lý do: {leave.reason}</p>
          {leave.leaderNote && (
            <p className="text-xs text-indigo-600">Ghi chú leader: {leave.leaderNote}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={s.cls}>{s.label}</span>
          {round && <ApprovalButtons id={leave.id} type="leave" round={round} />}
        </div>
      </div>
    </div>
  );
}

export default async function LeaderLeavePage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);
  if (!employee) return null;

  const isHR = employee.department.isHR;

  const [myPending, hrPending, allLeaves] = await Promise.all([
    isHR ? Promise.resolve([]) : getPendingLeavesForLeader(employee.departmentId),
    isHR ? getLeaderApprovedLeaves() : Promise.resolve([]),
    isHR ? getAllLeavesForHR() : Promise.resolve([]),
  ]);

  const pending = isHR ? hrPending : myPending;
  const round: "leader" | "hr" = isHR ? "hr" : "leader";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isHR ? "Xác nhận nghỉ phép (HR)" : "Duyệt nghỉ phép"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isHR
            ? "Vòng 2 — Xác nhận cuối sau khi leader phòng đã duyệt"
            : "Vòng 1 — Duyệt đơn của nhân viên trong phòng bạn"}
        </p>
      </div>

      {/* Chờ xử lý */}
      {pending.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <h2 className="font-semibold text-yellow-800">
              Chờ phê duyệt ({pending.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {pending.map((leave) => (
              <LeaveRow key={leave.id} leave={leave} round={round} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm">Không có đơn nào chờ phê duyệt 🎉</p>
        </div>
      )}

      {/* Tất cả (chỉ HR) */}
      {isHR && allLeaves.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Tất cả đơn ({allLeaves.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Nhân viên","Loại","Thời gian","Ngày","Trạng thái"].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allLeaves.map((l) => {
                  const s = STATUS_CFG[l.status];
                  return (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{l.employee.fullName}</p>
                        <p className="text-xs text-gray-400">{l.employee.department.name}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{TYPE_LABEL[l.type]}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(l.startDate).toLocaleDateString("vi-VN")} – {new Date(l.endDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-3 font-medium">{l.totalDays}</td>
                      <td className="px-5 py-3"><span className={s.cls}>{s.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
