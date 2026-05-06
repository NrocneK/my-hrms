"use client";

import { useState }                                              from "react";
import { createDepartment, updateDepartment, deleteDepartment } from "@/actions/department.action";
import { useRouter }                                            from "next/navigation";
import { useConfirm }                                           from "@/components/ui/ConfirmModal";

interface Dept {
  id: string; name: string; description?: string | null;
  isHR: boolean; leaderId?: string | null;
  leader?: { id: string; fullName: string } | null;
  _count?: { employees: number };
}
interface Emp { id: string; fullName: string; employeeCode: string; departmentId: string }

export function DepartmentManager({ departments, employees }: { departments: Dept[]; employees: Emp[] }) {
  const router  = useRouter();
  const confirm = useConfirm();
  const [mode,     setMode]    = useState<"list" | "add" | "edit">("list");
  const [editing,  setEditing] = useState<Dept | null>(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const [deleting, setDeleting]= useState<string | null>(null);

  function openEdit(dept: Dept) { setEditing(dept); setMode("edit"); setError(""); }
  function openAdd()             { setEditing(null); setMode("add");  setError(""); }
  function close()               { setMode("list");  setEditing(null); setError(""); }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError("");
    const fd = new FormData(e.currentTarget);
    const data = {
      name:        fd.get("name")        as string,
      description: fd.get("description") as string || undefined,
      isHR:        fd.get("isHR") === "true",
      leaderId:    fd.get("leaderId")    as string || null,
    };
    try {
      if (mode === "add") {
        await createDepartment({ name: data.name, description: data.description, isHR: data.isHR });
      } else if (editing) {
        await updateDepartment(editing.id, data);
      }
      router.refresh();
      close();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(dept: Dept) {
    const empCount = dept._count?.employees ?? 0;
    if (empCount > 0) {
      await confirm({
        title:       "Không thể xóa",
        message:     `Phòng "${dept.name}" còn ${empCount} nhân viên. Vui lòng chuyển nhân viên sang phòng khác trước.`,
        confirmText: "Đã hiểu",
        cancelText:  "",
        variant:     "warning",
      });
      return;
    }

    const ok = await confirm({
      title:       "Xóa phòng ban",
      message:     `Bạn có chắc muốn xóa phòng "${dept.name}"? Hành động này không thể hoàn tác.`,
      confirmText: "Xóa",
      variant:     "danger",
    });
    if (!ok) return;

    setDeleting(dept.id);
    try {
      await deleteDepartment(dept.id);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi.");
    } finally {
      setDeleting(null);
    }
  }

  const leaderCandidates = editing
    ? employees.filter(e => e.departmentId === editing.id)
    : [];

  if (mode !== "list") {
    return (
      <div className="card p-6 max-w-xl">
        <h2 className="font-semibold text-gray-900 mb-5">
          {mode === "add" ? "Thêm phòng ban mới" : `Chỉnh sửa: ${editing?.name}`}
        </h2>
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Tên phòng ban <span className="text-red-500">*</span></label>
            <input name="name" required defaultValue={editing?.name ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Mô tả</label>
            <input name="description" defaultValue={editing?.description ?? ""} className="input" />
          </div>
          <div className="flex items-center gap-3">
            <label className="label mb-0">Phòng Nhân sự (HR)?</label>
            <select name="isHR" defaultValue={editing?.isHR ? "true" : "false"} className="input w-auto">
              <option value="false">Không</option>
              <option value="true">Có — duyệt vòng 2</option>
            </select>
          </div>

          {mode === "edit" && leaderCandidates.length > 0 && (
            <div>
              <label className="label">Trưởng phòng</label>
              <select name="leaderId" defaultValue={editing?.leaderId ?? ""} className="input">
                <option value="">— Chưa có trưởng phòng —</option>
                {leaderCandidates.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} ({e.employeeCode}){editing?.leaderId === e.id ? " ✓" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {mode === "edit" && leaderCandidates.length === 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
              ⚠️ Phòng này chưa có nhân viên để gán trưởng phòng.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Đang lưu..." : mode === "add" ? "Tạo phòng ban" : "Lưu thay đổi"}
            </button>
            <button type="button" onClick={close} className="btn-secondary">Hủy</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={openAdd} className="btn-primary">+ Thêm phòng ban</button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => (
          <div key={dept.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 leading-tight">{dept.name}</h3>
                  {dept.isHR && <span className="badge-green text-xs">Phòng HR</span>}
                </div>
              </div>
              <span className="badge-blue">{dept._count?.employees ?? 0} NV</span>
            </div>

            {dept.description && (
              <p className="text-xs text-gray-500 mb-3">{dept.description}</p>
            )}

            <div className="flex items-center gap-2 mb-4">
              {dept.leader ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span className="badge-yellow">Leader</span>
                  <span>{dept.leader.fullName}</span>
                </div>
              ) : (
                <span className="text-xs text-red-400">⚠️ Chưa có trưởng phòng</span>
              )}
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-3">
              <button onClick={() => openEdit(dept)} className="btn-secondary text-xs flex-1">
                ✏️ Chỉnh sửa
              </button>
              <button
                onClick={() => handleDelete(dept)}
                disabled={deleting === dept.id}
                className="btn-danger text-xs px-3"
              >
                {deleting === dept.id ? "..." : "🗑️"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
