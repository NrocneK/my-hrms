import { getDepartments } from "@/actions/department.action";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import Link from "next/link";

export default async function NewEmployeePage() {
  const departments = await getDepartments();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/employees" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Thêm nhân viên</h1>
      </div>

      <EmployeeForm departments={departments} />
    </div>
  );
}
