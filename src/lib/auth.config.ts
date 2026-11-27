import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isAuthPage = pathname === "/" || pathname.startsWith("/login");
      const isPublic =
        isAuthPage ||
        // ฝังใน MIS: SSO + dashboard สาธารณะ + API สรุป — แอปหลักยัง login ตามเดิม
        pathname.startsWith("/embed") ||
        pathname.startsWith("/api/embed") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/q/") ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/api/sync") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";

      if (!isLoggedIn && !isPublic) return false;
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.username = user.username;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.departmentId =
          (token.departmentId as string | null) ?? null;
        session.user.departmentName =
          (token.departmentName as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
