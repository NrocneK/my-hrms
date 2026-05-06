import Link            from "next/link";
import { BackButton }  from "@/components/ui/BackButton";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative mx-auto w-40 h-40 mb-8">
          <div className="w-40 h-40 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-20 h-20 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-500 font-bold text-sm">404</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Không tìm thấy trang</h1>
        <p className="text-gray-500 mb-8">
          Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển sang địa chỉ khác.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-primary">Về trang chủ</Link>
          <BackButton />
        </div>

        <p className="text-xs text-gray-300 mt-8">HRMS · Hệ thống quản lý nhân sự</p>
      </div>
    </div>
  );
}
