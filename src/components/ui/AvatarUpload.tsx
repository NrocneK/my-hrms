"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

interface Props {
  employeeId: string;
  fullName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
}

const SIZES = {
  sm: { container: "w-8  h-8", text: "text-xs", icon: "w-3 h-3" },
  md: { container: "w-16 h-16", text: "text-xl", icon: "w-4 h-4" },
  lg: { container: "w-24 h-24", text: "text-3xl", icon: "w-5 h-5" },
};

export function AvatarUpload({
  employeeId, fullName, avatarUrl, size = "md", editable = false,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const s = SIZES[size];

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file ảnh."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh tối đa 5MB."); return;
    }

    setLoading(true); setError("");

    try {
      // 1. Upload lên Cloudinary trực tiếp từ browser (unsigned)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      formData.append("folder", "hrms/avatars");


      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!cloudRes.ok) throw new Error("Upload lên Cloudinary thất bại.");
      const cloudData = await cloudRes.json();

      // Thêm transformation: crop vuông, 200x200
      const optimizedUrl = cloudData.secure_url.replace(
        "/upload/",
        "/upload/c_fill,g_face,w_200,h_200,q_auto,f_auto/"
      );

      // 2. Lưu URL vào DB
      const dbRes = await fetch("/api/upload/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, avatarUrl: optimizedUrl }),
      });

      if (!dbRes.ok) throw new Error("Lưu ảnh vào hệ thống thất bại.");

      setPreview(optimizedUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${s.container} flex-shrink-0`}>
        {/* Avatar image hoặc initials */}
        {preview ? (
          <img
            src={preview}
            alt={fullName}
            className={`${s.container} rounded-full object-cover ring-2 ring-white shadow`}
          />
        ) : (
          <div className={`${s.container} rounded-full bg-blue-600 text-white flex items-center justify-center font-bold ${s.text} ring-2 ring-white shadow`}>
            {getInitials(fullName)}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center`}>
            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}

        {/* Edit button */}
        {editable && !loading && (
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Đổi ảnh đại diện"
          >
            <svg className={`${s.icon} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-500 text-center max-w-32">{error}</p>}

      {/* Hidden input */}
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      )}
    </div>
  );
}
