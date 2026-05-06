import { redirect }        from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  switch (session.user.role) {
    case "ADMIN":    redirect("/admin/dashboard");
    case "LEADER":   redirect("/leader/dashboard");
    default:         redirect("/employee/dashboard");
  }
}
