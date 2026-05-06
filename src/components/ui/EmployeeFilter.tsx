"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback }                               from "react";

interface Dept { id: string; name: string }

export function EmployeeFilter({ departments }: { departments: Dept[] }) {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else       p.delete(key);
    p.delete("page"); // reset về trang 1 khi filter
    router.push(`${pathname}?${p.toString()}`);
  }, [params, pathname, router]);

  return (
    <div className="card p-4 flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          type="text"
          placeholder="Tìm tên, mã NV..."
          defaultValue={params.get("q") ?? ""}
          onChange={e => update("q", e.target.value)}
          className="input pl-9 text-sm"
        />
      </div>

      {/* Phòng ban */}
      <select
        defaultValue={params.get("dept") ?? ""}
        onChange={e => update("dept", e.target.value)}
        className="input w-auto text-sm"
      >
        <option value="">Tất cả phòng ban</option>
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      {/* Trạng thái */}
      <select
        defaultValue={params.get("status") ?? ""}
        onChange={e => update("status", e.target.value)}
        className="input w-auto text-sm"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="active">Đang làm việc</option>
        <option value="inactive">Nghỉ việc</option>
      </select>

      {/* Vai trò */}
      <select
        defaultValue={params.get("role") ?? ""}
        onChange={e => update("role", e.target.value)}
        className="input w-auto text-sm"
      >
        <option value="">Tất cả vai trò</option>
        <option value="LEADER">Trưởng phòng</option>
        <option value="EMPLOYEE">Nhân viên</option>
      </select>

      {/* Sort */}
      <select
        defaultValue={params.get("sort") ?? ""}
        onChange={e => update("sort", e.target.value)}
        className="input w-auto text-sm"
      >
        <option value="">Sắp xếp: Mới nhất</option>
        <option value="name_asc">Tên A→Z</option>
        <option value="name_desc">Tên Z→A</option>
        <option value="salary_desc">Lương cao nhất</option>
        <option value="salary_asc">Lương thấp nhất</option>
        <option value="join_asc">Vào làm sớm nhất</option>
        <option value="join_desc">Vào làm muộn nhất</option>
      </select>

      {/* Clear */}
      {(params.get("q") || params.get("dept") || params.get("status") || params.get("role") || params.get("sort")) && (
        <button
          onClick={() => router.push(pathname)}
          className="btn-secondary text-sm whitespace-nowrap"
        >
          ✕ Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
