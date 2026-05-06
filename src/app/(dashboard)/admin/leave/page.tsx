import { getAllLeavesForAdmin } from "@/actions/leave.action";

const TYPE_LABEL: Record<string, string> = {
  ANNUAL: "Phép năm",
  SICK: "Nghỉ bệnh",
  PERSONAL: "Cá nhân",
  MATERNITY: "Thai sản",
  UNPAID: "Không lương",
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Chờ leader", cls: "badge-yellow" },
  LEADER_APPROVED: { label: "Chờ HR", cls: "badge-blue" },
  APPROVED: { label: "Đã duyệt", cls: "badge-green" },
  REJECTED: { label: "Từ chối", cls: "badge-red" },
  CANCELLED: { label: "Đã hủy", cls: "badge-gray" },
};

export default async function AdminLeavePage() {
  const leaves = await getAllLeavesForAdmin();

  const stats = {
    pending: leaves.filter((l) => l.status === "PENDING").length,
    waiting: leaves.filter((l) => l.status === "LEADER_APPROVED").length,
    approved: leaves.filter((l) => l.status === "APPROVED").length,
    rejected: leaves.filter((l) => l.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nghỉ phép — Tổng quan</h1>
        <p className="text-sm text-gray-400 mt-1">
          Admin chỉ theo dõi. Việc phê duyệt thuộc về Leader phòng và Leader HR.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Chờ leader", value: stats.pending, cls: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Chờ HR", value: stats.waiting, cls: "text-blue-600", bg: "bg-blue-50" },
          { label: "Đã duyệt", value: stats.approved, cls: "text-green-600", bg: "bg-green-50" },
          { label: "Từ chối", value: stats.rejected, cls: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Tất cả đơn ({leaves.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Nhân viên", "Loại", "Thời gian", "Số ngày", "Trạng thái", "Ghi chú"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leaves.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Chưa có đơn nào</td></tr>
              ) : leaves.map((l) => {
                const s = STATUS_CONFIG[l.status];
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{l.employee.fullName}</p>
                      <p className="text-xs text-gray-400">{l.employee.department.name}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{TYPE_LABEL[l.type]}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(l.startDate).toLocaleDateString("vi-VN")} –{" "}
                      {new Date(l.endDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-700">{l.totalDays}</td>
                    <td className="px-5 py-3"><span className={s.cls}>{s.label}</span></td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {l.leaderNote && <p>Leader: {l.leaderNote}</p>}
                      {l.hrNote && <p>HR: {l.hrNote}</p>}
                    </td>
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
