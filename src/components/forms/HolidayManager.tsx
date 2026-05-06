"use client";

import { useState }                          from "react";
import { createHoliday, deleteHoliday, seedVietnamHolidays } from "@/actions/holiday.action";
import { useRouter }                          from "next/navigation";

interface Holiday {
  id: string; name: string; date: Date; type: string;
}

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  PUBLIC:  { label: "Lễ quốc gia", cls: "badge-red"  },
  COMPANY: { label: "Nghỉ bù",     cls: "badge-blue" },
};

const VN_DAYS = ["CN","T2","T3","T4","T5","T6","T7"];

export function HolidayManager({ holidays, year }: { holidays: Holiday[]; year: number }) {
  const router   = useRouter();
  const [showAdd,  setShowAdd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [seeding,  setSeeding]  = useState(false);
  const [error,    setError]    = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await createHoliday({
        name: fd.get("name") as string,
        date: new Date(`${fd.get("date") as string}T00:00:00+07:00`),
        type: fd.get("type") as "PUBLIC" | "COMPANY",
      });
      router.refresh();
      setShowAdd(false);
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xóa ngày lễ "${name}"?`)) return;
    setDeleting(id);
    try {
      await deleteHoliday(id);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleSeed() {
    if (!confirm(`Thêm ngày lễ Việt Nam mặc định cho năm ${year}?\n\nLưu ý: Tết Nguyên Đán và Giỗ Tổ Hùng Vương đã được cập nhật chính xác cho từng năm từ 2025-2027.`)) return;
    setSeeding(true);
    try {
      const result = await seedVietnamHolidays(year);
      router.refresh();
      if (result.created === 0) {
        alert(`Tất cả ${result.total} ngày lễ đã tồn tại rồi.`);
      } else {
        alert(`Đã thêm ${result.created}/${result.total} ngày lễ.\n\nVui lòng kiểm tra lại và điều chỉnh nếu cần.`);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          + Thêm ngày lễ
        </button>
        <button onClick={handleSeed} disabled={seeding} className="btn-secondary">
          {seeding ? "Đang thêm..." : "🇻🇳 Thêm ngày lễ VN mặc định"}
        </button>
        <span className="text-sm text-gray-400">{holidays.length} ngày lễ năm {year}</span>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Thêm ngày lễ mới</h3>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
          )}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="label">Tên ngày lễ <span className="text-red-500">*</span></label>
              <input name="name" required className="input" placeholder="VD: Tết Nguyên Đán" />
            </div>
            <div>
              <label className="label">Ngày <span className="text-red-500">*</span></label>
              <input name="date" type="date" required className="input"
                min={`${year}-01-01`} max={`${year}-12-31`} />
            </div>
            <div>
              <label className="label">Loại</label>
              <select name="type" className="input">
                <option value="PUBLIC">Lễ quốc gia</option>
                <option value="COMPANY">Nghỉ bù</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setError(""); }}
                className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Holiday list */}
      {holidays.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-sm">Chưa có ngày lễ nào cho năm {year}</p>
          <p className="text-xs mt-1">Nhấn "Thêm ngày lễ VN mặc định" để bắt đầu</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Ngày","Thứ","Tên ngày lễ","Loại",""].map(h => (
                  <th key={h} className="text-left px-5 py-3 font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {holidays.map(h => {
                const d   = new Date(h.date);
                const day = d.getUTCDay();
                const t   = TYPE_LABEL[h.type] ?? { label: h.type, cls: "badge-gray" };
                return (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className={`px-5 py-3 font-medium ${day === 0 ? "text-red-500" : day === 6 ? "text-blue-500" : "text-gray-600"}`}>
                      {VN_DAYS[day]}
                    </td>
                    <td className="px-5 py-3 text-gray-900">{h.name}</td>
                    <td className="px-5 py-3"><span className={t.cls}>{t.label}</span></td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(h.id, h.name)}
                        disabled={deleting === h.id}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {deleting === h.id ? "..." : "Xóa"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
