"use client";

import { useState }        from "react";
import { changePassword }  from "@/actions/auth.action";
import { signOut }         from "next-auth/react";

export function ChangePasswordForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setSuccess(false);
    const fd      = new FormData(e.currentTarget);
    const current = fd.get("current")  as string;
    const next    = fd.get("new")      as string;
    const confirm = fd.get("confirm")  as string;

    if (next !== confirm) { setError("Mật khẩu xác nhận không khớp."); return; }
    if (next.length < 6)  { setError("Mật khẩu mới phải có ít nhất 6 ký tự."); return; }

    setLoading(true);
    try {
      await changePassword(userId, current, next);
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      // Tự động đăng xuất sau 2s để đăng nhập lại với mật khẩu mới
      setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          ✓ Đổi mật khẩu thành công! Đang đăng xuất để đăng nhập lại...
        </div>
      )}

      <div>
        <label className="label">Mật khẩu hiện tại</label>
        <input name="current" type="password" required className="input" placeholder="••••••" />
      </div>
      <div>
        <label className="label">Mật khẩu mới</label>
        <input name="new" type="password" required className="input" placeholder="Tối thiểu 6 ký tự" minLength={6} />
      </div>
      <div>
        <label className="label">Xác nhận mật khẩu mới</label>
        <input name="confirm" type="password" required className="input" placeholder="Nhập lại mật khẩu mới" />
      </div>

      <button type="submit" disabled={loading || success} className="btn-primary">
        {loading ? "Đang lưu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}
