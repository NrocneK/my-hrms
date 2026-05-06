import { getServerSession }    from "next-auth";
import { authOptions }         from "@/lib/auth";
import { getEmployeeByUserId } from "@/actions/employee.action";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ChangePasswordForm }  from "@/components/forms/ChangePasswordForm";
import { AvatarUpload }        from "@/components/ui/AvatarUpload";

export default async function EmployeeProfilePage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);

  if (!employee) {
    return <div className="card p-12 text-center text-gray-400">Không tìm thấy thông tin nhân viên.</div>;
  }

  const fields = [
    { label: "Mã nhân viên",  value: employee.employeeCode },
    { label: "Email",         value: employee.user?.email ?? "—" },
    { label: "Số điện thoại", value: employee.phone  || "—" },
    { label: "Giới tính",     value: employee.gender === "MALE" ? "Nam" : employee.gender === "FEMALE" ? "Nữ" : "Khác" },
    { label: "Ngày sinh",     value: formatDate(employee.dateOfBirth) },
    { label: "Địa chỉ",       value: employee.address || "—" },
    { label: "Phòng ban",     value: employee.department.name },
    { label: "Chức vụ",       value: employee.position },
    { label: "Lương",         value: formatCurrency(employee.salary) },
    { label: "Ngày vào làm",  value: formatDate(employee.joinDate) },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>

      {/* Profile card */}
      <div className="card p-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          <AvatarUpload
            employeeId={employee.id}
            fullName={employee.fullName}
            avatarUrl={employee.avatarUrl}
            size="lg"
            editable={true}
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{employee.fullName}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{employee.position} · {employee.department.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${employee.isActive ? "badge-green" : "badge-red"}`}>
                {employee.isActive ? "Đang làm việc" : "Nghỉ việc"}
              </span>
              <span className="badge badge-blue font-mono text-xs">{employee.employeeCode}</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Nhấn vào ảnh để đổi ảnh đại diện
            </p>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{f.label}</p>
              <p className="text-sm text-gray-900 mt-0.5 font-medium">{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Đổi mật khẩu */}
      <div className="card p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-900">Đổi mật khẩu</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Sau khi đổi, bạn sẽ được đăng xuất để đăng nhập lại với mật khẩu mới.
          </p>
        </div>
        <ChangePasswordForm userId={session!.user.id} />
      </div>
    </div>
  );
}
