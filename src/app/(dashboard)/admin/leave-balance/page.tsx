import { getAllBalances }        from "@/actions/leave-balance.action";
import { AdjustBalanceForm }     from "@/components/forms/AdjustBalanceForm";

export default async function LeaveBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp   = await searchParams;
  const year = Number(sp.year) || new Date().getFullYear();
  const balances = await getAllBalances(year);

  const years = [year - 1, year, year + 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý ngày phép</h1>
          <p className="text-sm text-gray-400 mt-1">Điều chỉnh số ngày phép năm cho từng nhân viên</p>
        </div>
        <div className="flex items-center gap-2">
          {years.map(y => (
            <a key={y} href={`?year=${y}`}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors
                ${y === year ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {y}
            </a>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tổng nhân viên",    value: balances.length,                                          color: "text-gray-900" },
          { label: "Đã dùng hết phép",  value: balances.filter(b => b.remainingDays === 0).length,       color: "text-red-600"  },
          { label: "Còn ≥ 10 ngày",     value: balances.filter(b => (b.remainingDays ?? 0) >= 10).length,color: "text-green-600"},
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Nhân viên","Phòng ban","Chức vụ","Tổng ngày","Đã dùng","Còn lại","Tiến độ","Điều chỉnh"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {balances.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Chưa có dữ liệu</td></tr>
              ) : balances.map(b => {
                const pct      = Math.round((b.usedDays / b.totalDays) * 100);
                const remaining = b.remainingDays ?? 0;
                return (
                  <tr key={b.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.fullName}</p>
                      <p className="text-xs text-gray-400">{b.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.department}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">{b.position}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.totalDays}</td>
                    <td className="px-4 py-3 text-yellow-600 font-medium">{b.usedDays}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${remaining === 0 ? "text-red-600" : remaining <= 3 ? "text-yellow-600" : "text-green-600"}`}>
                        {remaining}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-28">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 flex-shrink-0">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AdjustBalanceForm
                        employeeId={b.employeeId}
                        year={year}
                        currentTotal={b.totalDays}
                      />
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
