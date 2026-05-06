"use client";

import { useState }            from "react";
import { createLeaveRequest }  from "@/actions/leave.action";
import { useRouter }           from "next/navigation";

const LEAVE_TYPES = [
  { value: "ANNUAL",    label: "Nghỉ phép năm" },
  { value: "SICK",      label: "Nghỉ bệnh" },
  { value: "PERSONAL",  label: "Việc cá nhân" },
  { value: "MATERNITY", label: "Thai sản" },
  { value: "UNPAID",    label: "Không lương" },
];

interface Props {
  employeeId:    string;
  remainingDays: number;
  totalDays:     number;
  usedDays:      number;
}

export function LeaveRequestForm({ employeeId, remainingDays, totalDays, usedDays }: Props) {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [start,   setStart]   = useState("");
  const [end,     setEnd]     = useState("");
  const [type,    setType]    = useState("ANNUAL");

  function calcDays() {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end);
    if (e < s) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const d = cur.getDay();
      if (d !== 0 && d !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  const days        = calcDays();
  const isAnnual    = type === "ANNUAL";
  const notEnough   = isAnnual && days > remainingDays;

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(ev.currentTarget);
    try {
      await createLeaveRequest({
        employeeId,
        type:      fd.get("type") as any,
        startDate: new Date(`${fd.get("startDate") as string}T00:00:00+07:00`),
        endDate:   new Date(`${fd.get("endDate")   as string}T00:00:00+07:00`),
        reason:    fd.get("reason") as string,
      });
      router.push("/employee/leave");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      setLoading(false);
    }
  }

  const today = new Date(Date.now() + 7 * 3600000).toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Loại nghỉ */}
      <div>
        <label className="label">Loại nghỉ phép <span className="text-red-500">*</span></label>
        <select name="type" required className="input"
          value={type} onChange={e => setType(e.target.value)}>
          {LEAVE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Balance indicator — chỉ show khi chọn ANNUAL */}
      {isAnnual && (
        <div className={`rounded-lg px-4 py-3 text-sm ${remainingDays === 0 ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={remainingDays === 0 ? "text-red-700 font-medium" : "text-blue-700 font-medium"}>
              Ngày phép năm {new Date().getFullYear()}
            </span>
            <span className={`font-bold ${remainingDays === 0 ? "text-red-700" : "text-blue-700"}`}>
              Còn {remainingDays}/{totalDays} ngày
            </span>
          </div>
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${remainingDays === 0 ? "bg-red-400" : "bg-blue-500"}`}
              style={{ width: `${Math.round((usedDays / totalDays) * 100)}%` }}
            />
          </div>
          {remainingDays === 0 && (
            <p className="text-red-600 text-xs mt-2">
              Bạn đã hết ngày phép năm. Vui lòng chọn loại nghỉ khác.
            </p>
          )}
        </div>
      )}

      {/* Ngày */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Từ ngày <span className="text-red-500">*</span></label>
          <input name="startDate" type="date" required className="input"
            value={start} onChange={e => setStart(e.target.value)}
            min={today} />
        </div>
        <div>
          <label className="label">Đến ngày <span className="text-red-500">*</span></label>
          <input name="endDate" type="date" required className="input"
            value={end} onChange={e => setEnd(e.target.value)}
            min={start || today} />
        </div>
      </div>

      {/* Preview số ngày */}
      {days > 0 && (
        <div className={`rounded-lg px-4 py-3 text-sm ${notEnough ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          {notEnough ? (
            <>⚠️ Yêu cầu <strong>{days} ngày</strong> nhưng chỉ còn <strong>{remainingDays} ngày</strong> phép năm.</>
          ) : (
            <>📅 Tổng <strong>{days} ngày làm việc</strong>
              {isAnnual && remainingDays > 0 && <> · Sau khi nghỉ còn <strong>{remainingDays - days} ngày</strong></>}
            </>
          )}
        </div>
      )}

      {/* Lý do */}
      <div>
        <label className="label">Lý do <span className="text-red-500">*</span></label>
        <textarea name="reason" required rows={4} className="input resize-none"
          placeholder="Mô tả lý do xin nghỉ phép..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || days === 0 || notEnough}
          className="btn-primary"
        >
          {loading ? "Đang gửi..." : "Gửi đơn"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Hủy</button>
      </div>
    </form>
  );
}
