import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Authenticate desktop sync agent via SYNC_AGENT_API_KEY. */
export function requireSyncAgentKey(req: Request): void {
  const expected = process.env.SYNC_AGENT_API_KEY?.trim();
  if (!expected) {
    throw new Response(
      JSON.stringify({ error: "SYNC_AGENT_API_KEY ยังไม่ได้ตั้งค่าบนเซิร์ฟเวอร์" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const headerKey =
    req.headers.get("x-sync-key")?.trim() ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    "";

  if (!headerKey || !safeEqual(headerKey, expected)) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
