import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";

const bodySchema = z.object({
  serverUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
});

/**
 * Test sync API connectivity.
 * - Without body: checks server env key by calling local /api/sync/assets
 * - With serverUrl+apiKey: probes that endpoint (for admin verifying client settings)
 */
export async function POST(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ASSETS_IMPORT);

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "payload ไม่ถูกต้อง" }, { status: 400 });
    }

    const envKey = process.env.SYNC_AGENT_API_KEY?.trim() || "";
    const apiKey = parsed.data.apiKey?.trim() || envKey;
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "ยังไม่ได้ตั้ง SYNC_AGENT_API_KEY ใน .env ของเซิร์ฟเวอร์",
        },
        { status: 503 },
      );
    }

    const base =
      parsed.data.serverUrl?.replace(/\/$/, "") ||
      process.env.APP_URL?.replace(/\/$/, "") ||
      req.nextUrl.origin;

    const target = `${base}/api/sync/assets`;
    const started = Date.now();
    const res = await fetch(target, {
      method: "GET",
      headers: { "X-Sync-Key": apiKey },
      cache: "no-store",
    });
    const text = await res.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 200) };
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      target,
      body,
      error: res.ok ? null : "เชื่อมต่อไม่สำเร็จ",
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 },
    );
  }
}
