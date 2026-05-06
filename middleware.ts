import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path  = req.nextUrl.pathname;
    const role  = token?.role as string;

    // /admin/* — chỉ ADMIN
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboard(role), req.url));
    }

    // /leader/* — chỉ LEADER (và ADMIN)
    if (path.startsWith("/leader") && role !== "LEADER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboard(role), req.url));
    }

    // /employee/* — chỉ EMPLOYEE và LEADER (LEADER cũng có dashboard nhân viên)
    if (path.startsWith("/employee") && role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);

function getDashboard(role: string) {
  if (role === "ADMIN")    return "/admin/dashboard";
  if (role === "LEADER")   return "/leader/dashboard";
  return "/employee/dashboard";
}

export const config = {
  matcher: ["/admin/:path*", "/leader/:path*", "/employee/:path*"],
};
