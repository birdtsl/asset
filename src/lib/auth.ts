import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { isHosxpAuthEnabled } from "@/lib/hosxp/mysql";
import { verifyHosxpUserPassword } from "@/lib/hosxp/verify-password";
import {
  ensureLocalUserFromHosxp,
  loadLocalUserByUsername,
} from "@/lib/auth/hosxp-user";
import { verifyEmbedSsoToken } from "@/lib/embed-sso";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

async function markLogin(
  userId: string,
  username: string,
  via: "LOCAL" | "HOSXP" | "EMBED_SSO",
) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: "LOGIN",
      entity: "User",
      entityId: userId,
      detail: `เข้าสู่ระบบโดย ${username} (${via})`,
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;
        const local = await loadLocalUserByUsername(username);

        // 1) Local bcrypt (admin / users managed in Asset)
        if (local && local.status === "ACTIVE") {
          const validLocal = await compare(password, local.passwordHash);
          if (validLocal) {
            await markLogin(local.id, local.username, "LOCAL");
            return {
              id: local.id,
              name: local.name,
              email: local.email,
              username: local.username,
              roles: local.roles,
              permissions: local.permissions,
              departmentId: local.departmentId,
              departmentName: local.departmentName,
            };
          }
        }

        // 2) Shared ERP TSL / HOSxP opduser credentials
        if (isHosxpAuthEnabled()) {
          const hosxp = await verifyHosxpUserPassword(username, password);
          if (hosxp.ok) {
            const sessionUser = await ensureLocalUserFromHosxp({
              username,
              displayName: hosxp.displayName,
            });
            if (!sessionUser) return null;
            await markLogin(sessionUser.id, sessionUser.username, "HOSXP");
            return {
              id: sessionUser.id,
              name: sessionUser.name,
              email: sessionUser.email,
              username: sessionUser.username,
              roles: sessionUser.roles,
              permissions: sessionUser.permissions,
              departmentId: sessionUser.departmentId,
              departmentName: sessionUser.departmentName,
            };
          }
        }

        return null;
      },
    }),
    /** SSO จาก TSL MIS (แท็บทรัพยากรคลัง) — ไม่ต้องกรอกรหัส Smart Asset */
    Credentials({
      id: "embed-sso",
      name: "ERPTSL Embed SSO",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = typeof credentials?.token === "string" ? credentials.token : "";
        const payload = verifyEmbedSsoToken(token);
        if (!payload) return null;

        let sessionUser = null as Awaited<ReturnType<typeof ensureLocalUserFromHosxp>>;
        const existing = await loadLocalUserByUsername(payload.u);
        if (existing && existing.status === "ACTIVE") {
          sessionUser = {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            username: existing.username,
            roles: existing.roles,
            permissions: existing.permissions,
            departmentId: existing.departmentId,
            departmentName: existing.departmentName,
          };
        } else {
          sessionUser = await ensureLocalUserFromHosxp({
            username: payload.u,
            displayName: payload.n,
          });
        }
        if (!sessionUser) return null;

        await markLogin(sessionUser.id, sessionUser.username, "EMBED_SSO");
        return {
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          username: sessionUser.username,
          roles: sessionUser.roles,
          permissions: sessionUser.permissions,
          departmentId: sessionUser.departmentId,
          departmentName: sessionUser.departmentName,
        };
      },
    }),
  ],
});