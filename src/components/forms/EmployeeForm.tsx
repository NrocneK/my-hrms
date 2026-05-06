"use client";

import { useState } from "react";
import { createEmployee } from "@/actions/employee.action";
import { useRouter } from "next/navigation";
import { DepartmentType } from "@/types";

interface Props {
  departments: DepartmentType[];
}

export function EmployeeForm({ departments }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);

    try {
      await createEmployee({
        email:        fd.get("email") as string,
        password:     fd.get("password") as string,
        fullName:     fd.get("fullName") as string,
        phone:        fd.get("phone") as string || undefined,
        position:     fd.get("position") as string,
        salary:       Number(fd.get("salary")),
        departmentId: fd.get("departmentId") as string,
        gender:       fd.get("gender") as "MALE" | "FEMALE" | "OTHER",
        address:      fd.get("address") as string || undefined,
        dateOfBirth:  fd.get("dateOfBirth") ? new Date(fd.get("dateOfBirth") as string) : undefined,
        joinDate:     fd.get("joinDate") ? new Date(fd.get("joinDate") as string) : undefined,
      });
      router.push("/admin/employees");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Có lỗi xảy ra.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Account */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Thông tin tài khoản</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input name="email" type="email" required className="input" placeholder="nhanvien@company.com" />
          </div>
          <div>
            <label className="label">Mật khẩu <span className="text-red-500">*</span></label>
            <input name="password" type="password" required className="input" placeholder="Tối thiểu 6 ký tự" minLength={6} />
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Thông tin cá nhân</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Họ và tên <span className="text-red-500">*</span></label>
            <input name="fullName" required className="input" placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="label">Số điện thoại</label>
            <input name="phone" className="input" placeholder="0912345678" />
          </div>
          <div>
            <label className="label">Giới tính</label>
            <select name="gender" className="input">
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <div>
            <label className="label">Ngày sinh</label>
            <input name="dateOfBirth" type="date" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Địa chỉ</label>
            <input name="address" className="input" placeholder="123 Đường ABC, Quận 1, TP.HCM" />
          </div>
        </div>
      </div>

      {/* Work info */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Thông tin công việc</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Phòng ban <span className="text-red-500">*</span></label>
            <select name="departmentId" required className="input">
              <option value="">— Chọn phòng ban —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Chức vụ <span className="text-red-500">*</span></label>
            <input name="position" required className="input" placeholder="Lập trình viên" />
          </div>
          <div>
            <label className="label">Lương (VNĐ)</label>
            <input name="salary" type="number" min="0" step="500000" className="input" placeholder="10000000" />
          </div>
          <div>
            <label className="label">Ngày vào làm</label>
            <input name="joinDate" type="date" className="input" defaultValue={new Date().toISOString().split("T")[0]} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Đang lưu..." : "Tạo nhân viên"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Hủy
        </button>
      </div>
    </form>
  );
}
