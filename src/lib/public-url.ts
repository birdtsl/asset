import type { NextRequest } from "next/server";

const LAN_FALLBACK = "http://192.168.1.45:3004";

function stripSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function isLoopback(urlOrHost: string) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(urlOrHost);
}

/**
 * Origin ที่เบราว์เซอร์ในวง LAN เรียกใช้ได้จริง
 * หลีกเลี่ยง redirect ไป localhost:3004 ซึ่งเครื่องลูกข่ายมักไม่ได้รัน Smart Asset
 */
export function getPublicOrigin(req?: NextRequest): string {
  const fromEnv = stripSlash(
    process.env.APP_URL?.trim() || process.env.AUTH_URL?.trim() || "",
  );
  if (fromEnv && !isLoopback(fromEnv)) return fromEnv;

  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = (
      req.headers.get("x-forwarded-proto") ||
      req.nextUrl.protocol.replace(":", "") ||
      "http"
    ).replace(/:$/, "");
    if (host && !isLoopback(host)) return `${proto}://${host}`;
    if (fromEnv) return fromEnv;
    if (!isLoopback(req.nextUrl.origin)) return req.nextUrl.origin;
  }

  if (fromEnv) return fromEnv;
  return LAN_FALLBACK;
}
