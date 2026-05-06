"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-40 h-40 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-8">
          <svg className="w-20 h-20 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Đã xảy ra lỗi</h1>
        <p className="text-gray-500 mb-3">
          Hệ thống gặp sự cố không mong muốn. Vui lòng thử lại.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-300 font-mono mb-6">ID: {error.digest}</p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Thử lại
          </button>
          <a href="/" className="btn-secondary">Về trang chủ</a>
        </div>
      </div>
    </div>
  );
}
