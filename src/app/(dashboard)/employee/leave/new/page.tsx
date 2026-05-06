import { getServerSession }    from "next-auth";
import { authOptions }         from "@/lib/auth";
import { getEmployeeByUserId } from "@/actions/employee.action";
import { getOrCreateBalance }  from "@/actions/leave-balance.action";
import { LeaveRequestForm }    from "@/components/forms/LeaveRequestForm";
import Link                    from "next/link";

export default async function NewLeavePage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);
  if (!employee) return null;

  const balance = await getOrCreateBalance(employee.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employee/leave" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gửi đơn nghỉ phép</h1>
      </div>
      <LeaveRequestForm
        employeeId={employee.id}
        remainingDays={balance.remainingDays}
        totalDays={balance.totalDays}
        usedDays={balance.usedDays}
      />
    </div>
  );
}
