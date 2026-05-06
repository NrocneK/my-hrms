"use client";

import { useState }       from "react";
import { resetPassword }  from "@/actions/auth.action";
import { useRouter }      from "next/navigation";
import { useConfirm }     from "@/components/ui/ConfirmModal";

export function ResetPasswordButton({ userId, employeeName }: { userId: string; employeeName: string }) {
  const router  = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  async function handle() {
    const ok = await confirm({
      title:       "Reset mật khẩu",
      message:     `Reset mật khẩu của "${employeeName}" về mặc định 123456? Nhân viên cần đổi mật khẩu sau khi đăng nhập lại.`,
      confirmText: "Reset",
      cancelText:  "Hủy",
      variant:     "warning",
    });
    if (!ok) return;

    setLoading(true);
    try {
      await resetPassword(userId);
      setDone(true);
      router.refresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
        </svg>
        Đã reset về 123456
      </div>
    );
  }

  return (
    <button onClick={handle} disabled={loading}
      className="btn-secondary text-sm flex items-center gap-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
      </svg>
      {loading ? "Đang reset..." : "Reset mật khẩu"}
    </button>
  );
}
