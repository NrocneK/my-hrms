import { getDepartments } from "@/actions/department.action";
import { getEmployees } from "@/actions/employee.action";
import { DepartmentManager } from "@/components/forms/DepartmentManager";

export default async function DepartmentsPage() {
  const [departments, employees] = await Promise.all([
    getDepartments(),
    getEmployees(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Phòng ban</h1>
        <p className="text-gray-500 text-sm mt-1">{departments.length} phòng ban</p>
      </div>
      <DepartmentManager departments={departments} employees={employees} />
    </div>
  );
}
