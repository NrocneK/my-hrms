import { getEmployeeById }      from "@/actions/employee.action";
import { getDepartments }        from "@/actions/department.action";
import { notFound }              from "next/navigation";
import { EditEmployeeForm }      from "@/components/forms/EditEmployeeForm";
import { ResetPasswordButton }   from "@/components/forms/ResetPasswordButton";
import { AvatarUpload }          from "@/components/ui/AvatarUpload";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link                      from "next/link";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }  = await params;
  const [employee, departments] = await Promise.all([
    getEmployeeById(id),
    getDepartments(),
  ]);

  if (!employee) notFound();

  const isLeader = !!employee.leadingDepartment;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin/employees" className="hover:text-gray-600">Nhân viên</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{employee.fullName}</span>
      </div>

      {/* Header card */}
      <div className="card p-6 flex items-center gap-5">
        <AvatarUpload
          employeeId={employee.id}
          fullName={employee.fullName}
          avatarUrl={employee.avatarUrl}
          size="lg"
          editable={true}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{employee.fullName}</h1>
            {isLeader && <span className="badge-yellow">Leader</span>}
            <span className={employee.isActive ? "badge-green" : "badge-red"}>
              {employee.isActive ? "Đang làm việc" : "Nghỉ việc"}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {employee.position} · {employee.department.name}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="font-mono">{employee.employeeCode}</span>
            <span>·</span>
            <span>{employee.user.email}</span>
            <span>·</span>
            <span>Vào làm {formatDate(employee.joinDate)}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-400">Lương</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(employee.salary)}</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Chỉnh sửa thông tin</h2>
        <EditEmployeeForm employee={employee} departments={departments} />
      </div>

      {/* Reset password */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Reset mật khẩu</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Reset về mật khẩu mặc định <span className="font-mono font-medium text-gray-600">123456</span>.
              Nhân viên nên đổi mật khẩu ngay sau khi đăng nhập.
            </p>
          </div>
          <ResetPasswordButton
            userId={employee.userId}
            employeeName={employee.fullName}
          />
        </div>
      </div>
    </div>
  );
}
