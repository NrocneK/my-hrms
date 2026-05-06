import { prisma } from "@/lib/prisma";

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:         { label: "Chờ leader", cls: "badge-yellow" },
  LEADER_APPROVED: { label: "Chờ HR",     cls: "badge-blue"   },
  APPROVED:        { label: "Đã duyệt",   cls: "badge-green"  },
  REJECTED:        { label: "Từ chối",    cls: "badge-red"    },
  CANCELLED:       { label: "Đã hủy",     cls: "badge-gray"   },
};

function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default async function AdminCorrectionPage() {
  const corrections = await prisma.attendanceCorrection.findMany({
    orderBy: { createdAt: "desc" },
    include: { employee: { include: { department: true } } },
  });

  const stats = {
    pending:  corrections.filter(c => c.status === "PENDING").length,
    waiting:  corrections.filter(c => c.status === "LEADER_APPROVED").length,
    approved: corrections.filter(c => c.status === "APPROVED").length,
    rejected: corrections.filter(c => c.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bổ sung công — Tổng quan</h1>
        <p className="text-sm text-gray-400 mt-1">Admin chỉ theo dõi. Duyệt thuộc về Leader.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Chờ leader", value: stats.pending,  cls: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Chờ HR",     value: stats.waiting,  cls: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Đã duyệt",   value: stats.approved, cls: "text-green-600",  bg: "bg-green-50"  },
          { label: "Từ chối",    value: stats.rejected, cls: "text-red-600",    bg: "bg-red-50"    },
        ].map((s) => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Tất cả đơn ({corrections.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Nhân viên","Ngày","Giờ vào","Giờ ra","Lý do","Trạng thái"].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {corrections.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Chưa có đơn nào</td></tr>
              ) : corrections.map((c) => {
                const s = STATUS_CFG[c.status];
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.employee.fullName}</p>
                      <p className="text-xs text-gray-400">{c.employee.department.name}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(c.date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-5 py-3 text-green-600 font-semibold">{fmtTime(c.checkIn)}</td>
                    <td className="px-5 py-3 text-blue-600 font-semibold">{fmtTime(c.checkOut)}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{c.reason}</td>
                    <td className="px-5 py-3"><span className={s.cls}>{s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
