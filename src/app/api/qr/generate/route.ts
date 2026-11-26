import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import {
  ensureAssetQrToken,
  generateMissingQrTokens,
} from "@/lib/inspection/inspection-service";
import { generateQrDataUrl } from "@/lib/inspection/qr";

export async function POST(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ASSETS_MANAGE);
    const body = await req.json().catch(() => ({}));
    const assetId = body.assetId as string | undefined;
    const batch = Boolean(body.batch);

    if (batch) {
      const result = await generateMissingQrTokens(
        Number(body.limit || 500),
      );
      return NextResponse.json({ data: result });
    }

    if (!assetId) {
      return NextResponse.json({ error: "ต้องระบุ assetId" }, { status: 400 });
    }

    const ensured = await ensureAssetQrToken(assetId);
    const dataUrl = await generateQrDataUrl(ensured.url);
    return NextResponse.json({
      data: {
        token: ensured.token,
        url: ensured.url,
        dataUrl,
        assetCode: ensured.asset.assetCode,
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
