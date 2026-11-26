import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getInstallDefaults } from "@/lib/sync/install-defaults";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ASSETS_IMPORT);

    const defaults = getInstallDefaults();
    const packageDir = path.join(process.cwd(), "sync-agent", "dist", "package");
    const zipPath = path.join(
      process.cwd(),
      "sync-agent",
      "release",
      "TSL-Asset-Sync-1.0.0-Setup.zip",
    );
    const installerReady =
      fs.existsSync(packageDir) || fs.existsSync(zipPath);

    const recent = await prisma.auditLog.findMany({
      where: { action: "SYNC_AGENT_UPSERT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        createdAt: true,
        entityId: true,
        detail: true,
      },
    });

    return NextResponse.json({
      ok: true,
      apiKeyConfigured: Boolean(defaults?.apiKey),
      apiKeyHint: defaults?.apiKey
        ? `${defaults.apiKey.slice(0, 4)}…${defaults.apiKey.slice(-4)}`
        : null,
      /** Full key for admin copy / verify — ASSETS_IMPORT only */
      apiKey: defaults?.apiKey ?? null,
      serverUrl: defaults?.serverUrl ?? null,
      installerReady,
      recentSyncs: recent.map((r) => ({
        at: r.createdAt,
        deviceId: r.entityId,
        detail: r.detail,
      })),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
