import { NextRequest, NextResponse } from "next/server";
import { encode } from "@auth/core/jwt";
import { verifyEmbedSsoToken } from "@/lib/embed-sso";
import {
  ensureLocalUserFromHosxp,
  loadLocalUserByUsername,
} from "@/lib/auth/hosxp-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionCookieName(req: NextRequest): string {
  const secure =
    req.nextUrl.protocol === "https:" ||
    process.env.AUTH_URL?.startsWith("https://") === true;
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

function getAuthSecret(): string {
  return process.env.AUTH_SECRET?.trim() || "";
}

/**
 * SSO จาก TSL MIS — ตรวจ token แล้วตั้ง session cookie ของ Auth.js โดยตรง
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim() || "";
  const nextRaw = req.nextUrl.searchParams.get("next")?.trim() || "/dashboard";
  const nextPath = nextRaw.startsWith("/") ? nextRaw : "/dashboard";
  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(`/embed/sso/failed?reason=${encodeURIComponent(reason)}`, req.nextUrl.origin),
    );

  if (!token) return fail("missing_token");

  const payload = verifyEmbedSsoToken(token);
  if (!payload) return fail("invalid_or_mismatched_secret");

  const authSecret = getAuthSecret();
  if (!authSecret) return fail("missing_auth_secret");

  try {
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
    if (!sessionUser) return fail("user_provision_failed");

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { lastLoginAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "LOGIN",
        entity: "User",
        entityId: sessionUser.id,
        detail: `เข้าสู่ระบบโดย ${sessionUser.username} (EMBED_SSO)`,
      },
    });

    const cookie = sessionCookieName(req);
    const maxAge = 8 * 60 * 60;
    const jwt = await encode({
      token: {
        sub: sessionUser.id,
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        username: sessionUser.username,
        roles: sessionUser.roles,
        permissions: sessionUser.permissions,
        departmentId: sessionUser.departmentId,
        departmentName: sessionUser.departmentName,
      },
      secret: authSecret,
      salt: cookie,
      maxAge,
    });

    const res = NextResponse.redirect(new URL(nextPath, req.nextUrl.origin));
    res.cookies.set(cookie, jwt, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: cookie.startsWith("__Secure-"),
      maxAge,
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(`exception:${msg.slice(0, 120)}`);
  }
}
