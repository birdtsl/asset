import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEnvSecurityReport } from "@/lib/security/env";
import { isHosxpAuthEnabled, isHosxpConfigured, queryHosxp } from "@/lib/hosxp/mysql";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const env = getEnvSecurityReport();

  let dbOk = false;
  let dbError: string | null = null;
  let counts: Record<string, number> | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    const [assets, users, notifications] = await Promise.all([
      prisma.asset.count(),
      prisma.user.count(),
      prisma.notification.count(),
    ]);
    counts = { assets, users, notifications };
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "db_error";
  }

  let hosxp: { configured: boolean; enabled: boolean; ok: boolean; error?: string } = {
    configured: isHosxpConfigured(),
    enabled: isHosxpAuthEnabled(),
    ok: false,
  };
  if (hosxp.configured) {
    const ping = await queryHosxp("SELECT 1 AS ok");
    hosxp = {
      ...hosxp,
      ok: !ping.error,
      error: ping.error,
    };
  }

  const ok = dbOk && env.missing.length === 0;
  return NextResponse.json(
    {
      ok,
      service: "tsl-smart-asset",
      version: "0.1.0",
      timezone: env.timezone,
      latencyMs: Date.now() - started,
      database: { ok: dbOk, error: dbError, counts },
      hosxpAuth: hosxp,
      security: {
        envOk: env.ok,
        missing: env.missing,
        weakSecret: env.weakSecret,
        nodeEnv: env.nodeEnv,
      },
      checkedAt: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
