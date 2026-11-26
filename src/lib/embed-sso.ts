import crypto from "crypto";

export type EmbedSsoPayload = {
  /** usercode จาก ERPTSL / HOSxP */
  u: string;
  /** ชื่อแสดง */
  n?: string;
  /** หมดอายุ (epoch ms) */
  exp: number;
};

function getSecret(): string {
  return (
    process.env.SMART_ASSET_SSO_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    ""
  );
}

export function isEmbedSsoConfigured(): boolean {
  return Boolean(getSecret());
}

function sign(payloadB64: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/** ตรวจสอบ token ที่ ERPTSL ออกให้ — สำเร็จคืน username สำหรับสร้าง session */
export function verifyEmbedSsoToken(token: string | null | undefined): EmbedSsoPayload | null {
  if (!token || !getSecret()) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  if (!timingSafeEqualString(sig, sign(payloadB64))) return null;
  try {
    const raw = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as EmbedSsoPayload;
    if (!raw?.u || typeof raw.u !== "string") return null;
    if (typeof raw.exp !== "number" || raw.exp < Date.now()) return null;
    if (raw.n !== undefined && typeof raw.n !== "string") return null;
    return { u: raw.u.trim(), n: raw.n?.trim() || undefined, exp: raw.exp };
  } catch {
    return null;
  }
}
