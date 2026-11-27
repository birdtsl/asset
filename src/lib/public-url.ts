import type { NextRequest } from "next/server";

/** fallback เมื่อไม่มี host จาก request และ env เป็น localhost */
const FALLBACK_ORIGIN = "http://183.89.210.168:3004";

function stripSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function isLoopback(urlOrHost: string) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(urlOrHost);
}

/**
 * Origin ที่เบราว์เซอร์เรียกใช้ได้จริง
 * ลำดับ: Host ของ request → APP_URL/AUTH_URL → fallback สาธารณะ
 * ไม่บังคับ IP วง LAN เพื่อให้เปิดจากนอกวง (เช่น 183.89.x) แล้วยังดูรายละเอียดได้
 */
export function getPublicOrigin(req?: NextRequest): string {
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = (
      req.headers.get("x-forwarded-proto") ||
      req.nextUrl.protocol.replace(":", "") ||
      "http"
    ).replace(/:$/, "");
    if (host && !isLoopback(host)) return `${proto}://${host}`;
    if (!isLoopback(req.nextUrl.origin)) return stripSlash(req.nextUrl.origin);
  }

  const fromEnv = stripSlash(
    process.env.APP_URL?.trim() || process.env.AUTH_URL?.trim() || "",
  );
  if (fromEnv && !isLoopback(fromEnv)) return fromEnv;

  return FALLBACK_ORIGIN;
}
