"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id:       string;
  type:     "leave" | "correction";
  round:    "leader" | "hr";       // vòng duyệt
}

export function ApprovalButtons({ id, type, round }: Props) {
  const router = useRouter();
  const [mode,    setMode]    = useState<"idle" | "approve" | "reject">("idle");
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handle(action: "approve" | "reject") {
    if (action === "reject" && !note.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/approval", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, type, round, action, note: note || undefined }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Có lỗi xảy ra.");

      router.refresh();
      setMode("idle");
      setNote("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra.");
      setLoading(false);
    }
  }

  if (mode === "idle") {
    return (
      <div className="flex gap-2">
        <button onClick={() => setMode("approve")}
          className="btn-primary text-xs px-3 py-1.5">
          ✓ Duyệt
        </button>
        <button onClick={() => setMode("reject")}
          className="btn-danger text-xs px-3 py-1.5">
          ✕ Từ chối
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-56">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <textarea
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={mode === "reject" ? "Lý do từ chối (bắt buộc)..." : "Ghi chú (tuỳ chọn)..."}
        className="input text-xs resize-none py-1.5"
        autoFocus
      />
      <div className="flex gap-1.5">
        <button
          onClick={() => handle(mode)}
          disabled={loading || (mode === "reject" && !note.trim())}
          className={`text-xs px-3 py-1.5 flex-1 ${mode === "approve" ? "btn-primary" : "btn-danger"}`}
        >
          {loading ? "Đang xử lý..." : mode === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
        </button>
        <button
          onClick={() => { setMode("idle"); setNote(""); setError(""); }}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
