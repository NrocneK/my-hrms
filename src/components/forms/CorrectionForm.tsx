"use client";

import { useState } from "react";
import { createCorrection } from "@/actions/correction.action";
import { useRouter } from "next/navigation";

export function CorrectionForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(ev.currentTarget);
    const date = fd.get("date") as string; // "YYYY-MM-DD"
    const checkInTime = fd.get("checkIn") as string; // "HH:mm"
    const checkOutTime = fd.get("checkOut") as string; // "HH:mm"

    // Gắn +07:00 để đảm bảo parse đúng giờ VN, không bị lệch UTC
    try {
      await createCorrection({
        employeeId,
        date: new Date(`${date}T00:00:00+07:00`),
        checkIn: new Date(`${date}T${checkInTime}:00+07:00`),
        checkOut: new Date(`${date}T${checkOutTime}:00+07:00`),
        reason: fd.get("reason") as string,
      });
      router.push("/employee/correction");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      setLoading(false);
    }
  }

  // Tính ngày hôm nay theo VN để set max cho input date
  const todayVN = new Date(Date.now() + 7 * 3600000).toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className="label">Ngày cần bổ sung <span className="text-red-500">*</span></label>
        <input name="date" type="date" required className="input" max={todayVN} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Giờ vào (Check-IN) <span className="text-red-500">*</span></label>
          <input name="checkIn" type="time" required className="input" />
          <p className="text-xs text-gray-400 mt-1">Trước 8:15 = đúng giờ</p>
        </div>
        <div>
          <label className="label">Giờ ra (Check-OUT) <span className="text-red-500">*</span></label>
          <input name="checkOut" type="time" required className="input" />
        </div>
      </div>

      <div>
        <label className="label">Lý do <span className="text-red-500">*</span></label>
        <textarea
          name="reason" required rows={4} className="input resize-none"
          placeholder="Mô tả lý do quên chấm công và các bằng chứng nếu có (email, camera, v.v.)..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Đang gửi..." : "Gửi đơn"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Hủy</button>
      </div>
    </form>
  );
}
