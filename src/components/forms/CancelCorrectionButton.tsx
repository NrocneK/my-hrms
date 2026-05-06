"use client";

import { cancelCorrection } from "@/actions/correction.action";
import { useRouter }        from "next/navigation";
import { useState }         from "react";
import { useConfirm }       from "@/components/ui/ConfirmModal";

export function CancelCorrectionButton({ id, employeeId }: { id: string; employeeId: string }) {
  const router  = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);

  async function handle() {
    const ok = await confirm({
      title:       "Hủy đơn bổ sung công",
      message:     "Bạn có chắc muốn hủy đơn này không?",
      confirmText: "Hủy đơn",
      cancelText:  "Giữ lại",
      variant:     "warning",
    });
    if (!ok) return;

    setLoading(true);
    try {
      await cancelCorrection(id, employeeId);
      router.refresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi.");
      setLoading(false);
    }
  }

  return (
    <button onClick={handle} disabled={loading} className="btn-danger text-xs px-3 py-1">
      {loading ? "..." : "Hủy"}
    </button>
  );
}
