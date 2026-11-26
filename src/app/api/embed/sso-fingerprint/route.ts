import crypto from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** เปรียบเทียบว่า secret ฝั่ง Smart Asset ตรงกับ TSL MIS หรือไม่ (ไม่เปิดเผยค่า secret) */
export async function GET() {
  const sso = process.env.SMART_ASSET_SSO_SECRET?.trim() || "";
  const auth = process.env.AUTH_SECRET?.trim() || "";
  const effective = sso || auth;
  return NextResponse.json({
    ok: true,
    hasSmartAssetSsoSecret: Boolean(sso),
    hasAuthSecret: Boolean(auth),
    source: sso ? "SMART_ASSET_SSO_SECRET" : auth ? "AUTH_SECRET" : "none",
    fingerprint: effective
      ? crypto.createHash("sha256").update(effective).digest("hex").slice(0, 16)
      : null,
  });
}
