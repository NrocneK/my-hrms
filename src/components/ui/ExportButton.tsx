"use client";

import { useState } from "react";

interface Props {
  href:     string;
  label?:   string;
  variant?: "primary" | "secondary";
}

export function ExportButton({ href, label = "Xuất Excel", variant = "secondary" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res  = await fetch(href);
      if (!res.ok) throw new Error("Xuất thất bại.");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      // Lấy filename từ header
      const cd   = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename\*?=(?:UTF-8'')?(.+)/i);
      a.download  = match ? decodeURIComponent(match[1].replace(/"/g, "")) : "export.xlsx";
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Có lỗi khi xuất file. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`${variant === "primary" ? "btn-primary" : "btn-secondary"} flex items-center gap-2`}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
      )}
      {loading ? "Đang xuất..." : label}
    </button>
  );
}
