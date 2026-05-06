"use client";

import { useState }    from "react";
import { signIn }      from "next-auth/react";
import { useRouter }   from "next/navigation";

export function LoginForm() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd     = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      loginId:  fd.get("loginId"),
      password: fd.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Mã nhân viên hoặc mật khẩu không đúng.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="loginId" className="label">Mã nhân viên</label>
        <input
          id="loginId" name="loginId" type="text"
          required placeholder="EMP0001"
          className="input uppercase"
          style={{ textTransform: "uppercase" }}
        />
        <p className="text-xs text-gray-400 mt-1">Admin dùng mã: ADMIN</p>
      </div>

      <div>
        <label htmlFor="password" className="label">Mật khẩu</label>
        <input
          id="password" name="password" type="password"
          required placeholder="••••••"
          className="input"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Đang đăng nhập...
          </span>
        ) : "Đăng nhập"}
      </button>
    </form>
  );
}
