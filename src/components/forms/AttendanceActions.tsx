"use client";

import { useState, useEffect } from "react";
import { checkIn, checkOut } from "@/actions/attendance.action";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TodayAtt {
  id: string;
  checkIn: Date | null;
  checkOut: Date | null;
  status: string;
}

function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// ── Toast nhỏ gọn ──────────────────────────────────────────
function Toast({ message, type, onClose }: {
  message: string;
  type: "success" | "info" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: "bg-green-600",
    info: "bg-blue-600",
    error: "bg-amber-500",
  };
  const icons = {
    success: "M5 13l4 4L19 7",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    error: "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg animate-fade-in ${styles[type]}`}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[type]} />
      </svg>
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export function AttendanceActions({
  employeeId,
  todayAtt: initialAtt,
}: {
  employeeId: string;
  todayAtt: TodayAtt | null;
}) {
  const router = useRouter();
  const [att, setAtt] = useState<TodayAtt | null>(initialAtt);
  const [loading, setLoading] = useState<"in" | "out" | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "info" | "error") {
    setToast({ message, type });
  }

  async function handle(type: "in" | "out") {
    // Nếu local state đã có → thông báo ngay, không gọi server
    if (type === "in" && att?.checkIn) {
      showToast(`Bạn đã check-in lúc ${fmtTime(att.checkIn)} rồi 👌`, "info");
      return;
    }
    if (type === "out" && att?.checkOut) {
      showToast(`Bạn đã check-out lúc ${fmtTime(att.checkOut)} rồi 👌`, "info");
      return;
    }

    setLoading(type);
    try {
      const result = type === "in"
        ? await checkIn(employeeId)
        : await checkOut(employeeId);

      setAtt({
        id: result.id,
        checkIn: result.checkIn,
        checkOut: result.checkOut,
        status: result.status,
      });

      if (type === "in") {
        const late = result.status === "LATE";
        showToast(
          late
            ? `Check-in lúc ${fmtTime(result.checkIn!)} — Đi trễ một chút 😅`
            : `Check-in thành công lúc ${fmtTime(result.checkIn!)} 🎉`,
          late ? "error" : "success"
        );
      } else {
        showToast(`Check-out thành công lúc ${fmtTime(result.checkOut!)} 👏`, "success");
      }

      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Có lỗi xảy ra.";

      // Nếu server báo đã check-in rồi (do timezone cũ còn trong DB)
      // → fetch lại bản ghi thực từ server để cập nhật local state
      if (msg.includes("đã check-in") || msg.includes("đã check-out")) {
        showToast(msg + " 👌", "info");
        router.refresh(); // trigger re-render để lấy initialAtt mới
      } else {
        showToast(msg, "error");
      }
    } finally {
      setLoading(null);
    }
  }

  const hasIn = !!att?.checkIn;
  const hasOut = !!att?.checkOut;

  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* CHECK-IN */}
          <div className={cn(
            "rounded-xl border-2 p-4 flex flex-col gap-3 transition-all",
            hasIn ? "border-green-200 bg-green-50" : "border-dashed border-gray-200 bg-white"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                hasIn ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
              )}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className={cn("text-sm font-semibold", hasIn ? "text-green-700" : "text-gray-500")}>
                Check-IN
              </span>
            </div>

            {hasIn ? (
              <div>
                <p className="text-xs text-gray-400">Giờ vào</p>
                <p className="text-lg font-bold text-green-600">{fmtTime(att!.checkIn!)}</p>
                {att!.status === "LATE" && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                    Đi trễ
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={() => handle("in")}
                disabled={loading !== null}
                className="btn-primary w-full"
              >
                {loading === "in" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : "Check-IN"}
              </button>
            )}
          </div>

          {/* CHECK-OUT */}
          <div className={cn(
            "rounded-xl border-2 p-4 flex flex-col gap-3 transition-all",
            hasOut ? "border-blue-200 bg-blue-50"
              : hasIn ? "border-dashed border-gray-200 bg-white"
                : "border-dashed border-gray-100 bg-gray-50 opacity-50"
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                hasOut ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
              )}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className={cn("text-sm font-semibold", hasOut ? "text-blue-700" : "text-gray-500")}>
                Check-OUT
              </span>
            </div>

            {hasOut ? (
              <div>
                <p className="text-xs text-gray-400">Giờ ra</p>
                <p className="text-lg font-bold text-blue-600">{fmtTime(att!.checkOut!)}</p>
              </div>
            ) : hasIn ? (
              <button
                onClick={() => handle("out")}
                disabled={loading !== null}
                className="btn-secondary w-full"
              >
                {loading === "out" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : "Check-OUT"}
              </button>
            ) : (
              <p className="text-xs text-gray-400 mt-auto">Cần check-in trước</p>
            )}
          </div>
        </div>

        {/* Done */}
        {hasIn && hasOut && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 rounded-lg px-4 py-2.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Hoàn tất chấm công hôm nay!
          </div>
        )}
      </div>
    </>
  );
}
