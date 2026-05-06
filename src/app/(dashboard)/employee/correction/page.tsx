import { getServerSession }        from "next-auth";
import { authOptions }             from "@/lib/auth";
import { getEmployeeByUserId }     from "@/actions/employee.action";
import { getCorrectionsByEmployee } from "@/actions/correction.action";
import { CancelCorrectionButton }  from "@/components/forms/CancelCorrectionButton";
import Link                        from "next/link";

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

export default async function EmployeeCorrectionPage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);
  if (!employee) return null;

  const corrections = await getCorrectionsByEmployee(employee.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bổ sung công</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dành cho trường hợp đến đúng giờ nhưng quên chấm công
          </p>
        </div>
        <Link href="/employee/correction/new" className="btn-primary">+ Gửi đơn bổ sung</Link>
      </div>

      {/* Luồng xử lý */}
      <div className="card px-5 py-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        <span className="text-xs font-medium text-gray-400 mr-1">Luồng duyệt:</span>
        <span className="badge-blue">Bạn gửi đơn</span>
        <span>→</span>
        <span className="badge-yellow">Leader phòng duyệt</span>
        <span>→</span>
        <span className="badge-blue">HR xác nhận</span>
        <span>→</span>
        <span className="badge-green">Chấm công được cập nhật</span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Ngày","Giờ vào","Giờ ra","Lý do","Trạng thái",""].map(h => (
                <th key={h} className="text-left px-5 py-3 font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {corrections.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Chưa có đơn bổ sung công nào</td></tr>
            ) : corrections.map((c) => {
              const s = STATUS_CFG[c.status];
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-700 whitespace-nowrap">
                    {new Date(c.date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-5 py-3 text-green-600 font-semibold">{fmtTime(c.checkIn)}</td>
                  <td className="px-5 py-3 text-blue-600 font-semibold">{fmtTime(c.checkOut)}</td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{c.reason}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={s.cls}>{s.label}</span>
                      {c.status === "REJECTED" && c.leaderNote && (
                        <p className="text-xs text-red-500">Leader: {c.leaderNote}</p>
                      )}
                      {c.status === "REJECTED" && c.hrNote && (
                        <p className="text-xs text-red-500">HR: {c.hrNote}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {c.status === "PENDING" && (
                      <CancelCorrectionButton id={c.id} employeeId={employee.id} />
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
