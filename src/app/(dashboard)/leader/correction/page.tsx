import { getServerSession }           from "next-auth";
import { authOptions }                from "@/lib/auth";
import { getEmployeeByUserId }        from "@/actions/employee.action";
import {
  getPendingCorrectionsForLeader,
  getLeaderApprovedCorrections,
  getAllCorrectionsForHR,
} from "@/actions/correction.action";
import { ApprovalButtons } from "@/components/forms/ApprovalButtons";

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:         { label: "Chờ leader", cls: "badge-yellow" },
  LEADER_APPROVED: { label: "Chờ HR",     cls: "badge-blue"   },
  APPROVED:        { label: "Đã duyệt",   cls: "badge-green"  },
  REJECTED:        { label: "Từ chối",    cls: "badge-red"    },
  CANCELLED:       { label: "Đã hủy",     cls: "badge-gray"   },
};

function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function calcHours(ci: Date | string, co: Date | string) {
  const diff = (new Date(co).getTime() - new Date(ci).getTime()) / 3_600_000;
  return `${diff.toFixed(1)}h`;
}

function CorrectionCard({ c, round }: { c: any; round?: "leader" | "hr" }) {
  const s = STATUS_CFG[c.status];
  return (
    <div className="px-5 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Employee info */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900">{c.employee.fullName}</p>
            <span className="text-xs text-gray-400">{c.employee.employeeCode}</span>
            <span className="badge-gray text-xs">{c.employee.department.name}</span>
          </div>

          {/* Date + times */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">
              📅 {new Date(c.date).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                IN {fmtTime(c.checkIn)}
              </span>
              <span className="text-gray-300">→</span>
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                OUT {fmtTime(c.checkOut)}
              </span>
              <span className="text-xs text-gray-400">({calcHours(c.checkIn, c.checkOut)})</span>
            </span>
          </div>

          {/* Reason */}
          <p className="text-xs text-gray-400 max-w-md line-clamp-2">Lý do: {c.reason}</p>

          {/* Notes */}
          {c.leaderNote && (
            <p className="text-xs text-indigo-600">💬 Leader: {c.leaderNote}</p>
          )}
          {c.hrNote && (
            <p className="text-xs text-purple-600">💬 HR: {c.hrNote}</p>
          )}

          {/* Timestamps */}
          <p className="text-xs text-gray-300">
            Gửi: {new Date(c.createdAt).toLocaleDateString("vi-VN")}
            {c.leaderAt && ` · Leader duyệt: ${new Date(c.leaderAt).toLocaleDateString("vi-VN")}`}
          </p>
        </div>

        {/* Status + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={s.cls}>{s.label}</span>
          {round && <ApprovalButtons id={c.id} type="correction" round={round} />}
        </div>
      </div>
    </div>
  );
}

export default async function LeaderCorrectionPage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);
  if (!employee) return null;

  const isHR = employee.department.isHR;
  const round: "leader" | "hr" = isHR ? "hr" : "leader";

  const [myPending, hrPending, allCorrections] = await Promise.all([
    isHR ? Promise.resolve([]) : getPendingCorrectionsForLeader(employee.departmentId),
    isHR ? getLeaderApprovedCorrections() : Promise.resolve([]),
    isHR ? getAllCorrectionsForHR()       : Promise.resolve([]),
  ]);

  const pending = isHR ? hrPending : myPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isHR ? "Xác nhận bổ sung công (HR)" : "Duyệt bổ sung công"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {isHR
            ? "Vòng 2 — Xác nhận và cập nhật chấm công sau khi leader phòng đã duyệt"
            : "Vòng 1 — Xem xét đơn bổ sung công của nhân viên trong phòng bạn"}
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
            {pending.map((c) => (
              <CorrectionCard key={c.id} c={c} round={round} />
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
      {isHR && allCorrections.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Tất cả đơn ({allCorrections.length})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {allCorrections.map((c) => (
              <CorrectionCard key={c.id} c={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
