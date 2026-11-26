import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import {
  buildInstallerZipWithDefaults,
  getInstallDefaults,
} from "@/lib/sync/install-defaults";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ASSETS_IMPORT);

    const defaults = getInstallDefaults();
    if (!defaults) {
      return NextResponse.json(
        {
          error:
            "ยังไม่ได้ตั้ง SYNC_AGENT_API_KEY ใน .env — ตั้งค่าแล้วรีสตาร์ทแอปก่อนดาวน์โหลด",
        },
        { status: 503 },
      );
    }

    const overrideUrl = req.nextUrl.searchParams.get("serverUrl")?.trim();
    if (overrideUrl) {
      try {
        const u = new URL(overrideUrl);
        if (u.protocol === "http:" || u.protocol === "https:") {
          defaults.serverUrl = u.origin;
        }
      } catch {
        /* keep env APP_URL */
      }
    }

    const buf = buildInstallerZipWithDefaults(defaults);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="TSL-Asset-Sync-1.0.0-Setup.zip"',
        "Content-Length": String(buf.length),
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
