"use client";

import { useState }             from "react";
import { updateEmployeeFull, toggleEmployeeActive } from "@/actions/employee.action";
import { useRouter }            from "next/navigation";
import { useConfirm }           from "@/components/ui/ConfirmModal";

interface Dept { id: string; name: string }
interface Emp  {
  id: string; fullName: string; phone?: string | null;
  position: string; salary: number; departmentId: string;
  gender: string; dateOfBirth?: Date | null; address?: string | null;
  joinDate: Date; isActive: boolean;
  user: { role: string };
}

export function EditEmployeeForm({ employee, departments }: { employee: Emp; departments: Dept[] }) {
  const router  = useRouter();
  const confirm = useConfirm();
  const [loading,  setLoading]  = useState(false);
  const [toggling, setToggling] = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess(false);
    const fd = new FormData(e.currentTarget);
    try {
      await updateEmployeeFull(employee.id, {
        fullName:     fd.get("fullName")     as string,
        phone:        fd.get("phone")        as string || undefined,
        position:     fd.get("position")     as string,
        salary:       Number(fd.get("salary")),
        departmentId: fd.get("departmentId") as string,
        gender:       fd.get("gender")       as "MALE" | "FEMALE" | "OTHER",
        address:      fd.get("address")      as string || undefined,
        dateOfBirth:  fd.get("dateOfBirth")  ? new Date(fd.get("dateOfBirth") as string) : null,
        joinDate:     new Date(fd.get("joinDate") as string),
        role:         fd.get("role")         as "ADMIN" | "LEADER" | "EMPLOYEE",
      });
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    const isActive = employee.isActive;
    const ok = await confirm({
      title:       isActive ? "Cho nghỉ việc" : "Kích hoạt lại",
      message:     isActive
        ? `Xác nhận cho "${employee.fullName}" nghỉ việc? Tài khoản sẽ bị vô hiệu hóa.`
        : `Kích hoạt lại tài khoản cho "${employee.fullName}"?`,
      confirmText: isActive ? "Cho nghỉ việc" : "Kích hoạt",
      variant:     isActive ? "danger" : "info",
    });
    if (!ok) return;

    setToggling(true);
    try {
      await toggleEmployeeActive(employee.id);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setToggling(false);
    }
  }

  const dob  = employee.dateOfBirth
    ? new Date(employee.dateOfBirth).toISOString().split("T")[0] : "";
  const join = new Date(employee.joinDate).toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error   && <div className="rounded-lg bg-red-50   border border-red-200   px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">✓ Đã lưu thay đổi</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Họ và tên <span className="text-red-500">*</span></label>
          <input name="fullName" required defaultValue={employee.fullName} className="input" />
        </div>
        <div>
          <label className="label">Số điện thoại</label>
          <input name="phone" defaultValue={employee.phone ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Giới tính</label>
          <select name="gender" defaultValue={employee.gender} className="input">
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>
        <div>
          <label className="label">Ngày sinh</label>
          <input name="dateOfBirth" type="date" defaultValue={dob} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Địa chỉ</label>
          <input name="address" defaultValue={employee.address ?? ""} className="input" />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Phòng ban <span className="text-red-500">*</span></label>
          <select name="departmentId" required defaultValue={employee.departmentId} className="input">
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Chức vụ <span className="text-red-500">*</span></label>
          <input name="position" required defaultValue={employee.position} className="input" />
        </div>
        <div>
          <label className="label">Lương (VNĐ)</label>
          <input name="salary" type="number" min="0" step="500000" defaultValue={employee.salary} className="input" />
        </div>
        <div>
          <label className="label">Ngày vào làm</label>
          <input name="joinDate" type="date" defaultValue={join} className="input" />
        </div>
        <div>
          <label className="label">Vai trò hệ thống</label>
          <select name="role" defaultValue={employee.user.role} className="input">
            <option value="EMPLOYEE">Nhân viên</option>
            <option value="LEADER">Trưởng phòng</option>
            <option value="ADMIN">Admin</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">⚠️ Mỗi phòng chỉ có 1 trưởng phòng</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button type="button" onClick={handleToggle} disabled={toggling}
          className={employee.isActive ? "btn-danger text-sm" : "btn-secondary text-sm"}>
          {toggling ? "Đang xử lý..." : employee.isActive ? "Cho nghỉ việc" : "Kích hoạt lại"}
        </button>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Hủy</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </form>
  );
}
