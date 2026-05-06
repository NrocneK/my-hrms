import { NextAuthOptions } from "next-auth";
import CredentialsProvider  from "next-auth/providers/credentials";
import { prisma }           from "@/lib/prisma";
import bcrypt               from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        loginId:  { label: "Mã nhân viên", type: "text"     },
        password: { label: "Mật khẩu",     type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.loginId || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where:   { loginId: credentials.loginId.toUpperCase() },
          include: { employee: true },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id:      user.id,
          email:   user.email,
          loginId: user.loginId,
          role:    user.role,
          name:    user.employee?.fullName ?? user.loginId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id      = user.id;
        token.role    = (user as { role?: string }).role;
        token.loginId = (user as { loginId?: string }).loginId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id      = token.id      as string;
        session.user.role    = token.role    as string;
        session.user.loginId = token.loginId as string;
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name?: string | null; role: string; loginId: string };
  }
  interface User { role?: string; loginId?: string; }
}
declare module "next-auth/jwt" {
  interface JWT { id?: string; role?: string; loginId?: string; }
}

export type AppRole = "ADMIN" | "LEADER" | "EMPLOYEE";
