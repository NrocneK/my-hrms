import { getServerSession }    from "next-auth";
import { authOptions }         from "@/lib/auth";
import { redirect }            from "next/navigation";
import { getEmployeeByUserId } from "@/actions/employee.action";
import { DashboardShell }      from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const employee = await getEmployeeByUserId(session.user.id);

  return (
    <DashboardShell
      role={session.user.role}
      user={{ ...session.user, avatarUrl: employee?.avatarUrl ?? null }}
    >
      {children}
    </DashboardShell>
  );
}
