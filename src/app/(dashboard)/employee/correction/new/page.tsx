import { getServerSession }    from "next-auth";
import { authOptions }         from "@/lib/auth";
import { getEmployeeByUserId } from "@/actions/employee.action";
import { CorrectionForm }      from "@/components/forms/CorrectionForm";
import Link                    from "next/link";

export default async function NewCorrectionPage() {
  const session  = await getServerSession(authOptions);
  const employee = await getEmployeeByUserId(session!.user.id);
  if (!employee) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employee/correction" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gửi đơn bổ sung công</h1>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
        💡 Chức năng này dành cho trường hợp bạn <strong>đến đúng giờ nhưng quên chấm công</strong>. 
        Đơn sẽ được leader phòng xem xét trước khi gửi lên HR xác nhận.
      </div>

      <CorrectionForm employeeId={employee.id} />
    </div>
  );
}
