import { prisma }           from "@/lib/prisma";
import { getDepartments }   from "@/actions/department.action";
import { formatDate, formatCurrency } from "@/lib/utils";
import { EmployeeFilter }   from "@/components/ui/EmployeeFilter";
import { ExportButton }     from "@/components/ui/ExportButton";
import Link                 from "next/link";
import { Prisma }           from "@prisma/client";

const PAGE_SIZE = 15;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; dept?: string; status?: string;
    role?: string; sort?: string; page?: string;
  }>;
}) {
  const sp   = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  // ── Build where ───────────────────────────────────────────
  const where: Prisma.EmployeeWhereInput = {};

  if (sp.q) {
    where.OR = [
      { fullName:     { contains: sp.q } },
      { employeeCode: { contains: sp.q } },
      { user: { email: { contains: sp.q } } },
    ];
  }
  if (sp.dept)   where.departmentId = sp.dept;
  if (sp.status) where.isActive = sp.status === "active";
  if (sp.role)   where.user = { role: sp.role as any };

  // ── Build orderBy ─────────────────────────────────────────
  const orderByMap: Record<string, Prisma.EmployeeOrderByWithRelationInput> = {
    name_asc:    { fullName: "asc"  },
    name_desc:   { fullName: "desc" },
    salary_desc: { salary: "desc"   },
    salary_asc:  { salary: "asc"    },
    join_asc:    { joinDate: "asc"  },
    join_desc:   { joinDate: "desc" },
  };
  const orderBy = orderByMap[sp.sort ?? ""] ?? { createdAt: "desc" };

  // ── Query ─────────────────────────────────────────────────
  const [employees, total, departments] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy,
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
      include: {
        department:       true,
        leadingDepartment:{ select: { id: true } },
        user:             { select: { email: true, role: true } },
      },
    }),
    prisma.employee.count({ where }),
    getDepartments(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilter  = !!(sp.q || sp.dept || sp.status || sp.role || sp.sort);

  // Tạo URL helper
  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (sp.q)      params.set("q",      sp.q);
    if (sp.dept)   params.set("dept",   sp.dept);
    if (sp.status) params.set("status", sp.status);
    if (sp.role)   params.set("role",   sp.role);
    if (sp.sort)   params.set("sort",   sp.sort);
    if (p > 1)     params.set("page",   String(p));
    const qs = params.toString();
    return `/admin/employees${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhân viên</h1>
          <p className="text-gray-500 text-sm mt-1">
            {hasFilter
              ? <>{total} kết quả{" "}<span className="text-gray-400">/ tổng {await prisma.employee.count()} nhân viên</span></>
              : <>{total} nhân viên · <span className="text-green-600">{await prisma.employee.count({ where: { isActive: true } })} đang làm</span></>
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            href={`/api/export/employees${sp.dept ? `?dept=${sp.dept}` : ""}${sp.status ? `${sp.dept ? "&" : "?"}status=${sp.status}` : ""}`}
            label="Xuất Excel"
          />
          <Link href="/admin/employees/new" className="btn-primary">+ Thêm nhân viên</Link>
        </div>
      </div>

      {/* Filter bar */}
      <EmployeeFilter departments={departments} />

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Nhân viên</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Mã NV</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Phòng ban</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Chức vụ</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Lương</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Ngày vào</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Trạng thái</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    {hasFilter ? "Không tìm thấy nhân viên nào phù hợp" : "Chưa có nhân viên nào"}
                  </td>
                </tr>
              ) : employees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={emp.fullName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {emp.fullName.split(" ").slice(-1)[0][0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{emp.fullName}</p>
                        <p className="text-xs text-gray-400">{emp.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{emp.employeeCode}</td>
                  <td className="px-5 py-3 text-gray-600">{emp.department.name}</td>
                  <td className="px-5 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      {emp.leadingDepartment && <span className="badge-yellow text-xs">Leader</span>}
                      <span className="truncate max-w-32">{emp.position}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{formatCurrency(emp.salary)}</td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(emp.joinDate)}</td>
                  <td className="px-5 py-3">
                    <span className={emp.isActive ? "badge-green" : "badge-red"}>
                      {emp.isActive ? "Đang làm" : "Nghỉ việc"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/employees/${emp.id}`}
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                      Xem / Sửa →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Trang {page}/{totalPages} · {total} kết quả
            </p>
            <div className="flex gap-1.5">
              {page > 1 && (
                <Link href={buildUrl(page - 1)} className="btn-secondary text-xs px-3 py-1.5">
                  ← Trước
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <Link
                    key={p}
                    href={buildUrl(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                      ${p === page ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                  >
                    {p}
                  </Link>
                );
              })}
              {page < totalPages && (
                <Link href={buildUrl(page + 1)} className="btn-secondary text-xs px-3 py-1.5">
                  Sau →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
