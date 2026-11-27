/** ลิงก์กลับไป dashboard ตัวชี้วัดผู้อำนวยการ ของ TSL MIS (erptsl) */

export const DEFAULT_MIS_ORIGIN = "http://183.89.210.168:3000";
export const MIS_FROM_COOKIE = "tsl_from_mis";
export const MIS_RETURN_COOKIE = "tsl_mis_return_url";

export function getMisOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_MIS_ORIGIN?.trim() ||
    process.env.MIS_ORIGIN?.trim() ||
    DEFAULT_MIS_ORIGIN;
  return raw.replace(/\/+$/, "");
}

/** path มาตรฐาน — ตัวชี้วัดผู้อำนวยการ · แท็บทรัพยากรคลัง */
export const MIS_DIRECTOR_WAREHOUSE_PATH =
  "/dashboard?nav=director-kpi&tab=warehouse";

export function buildMisDirectorWarehouseUrl(origin?: string): string {
  const base = (origin || getMisOrigin()).replace(/\/+$/, "");
  return `${base}${MIS_DIRECTOR_WAREHOUSE_PATH}`;
}

/** หน้าตัวชี้วัดผู้อำนวยการ · แท็บทรัพยากรคลัง */
export function getMisDirectorWarehouseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_MIS_DASHBOARD_URL?.trim();
  if (explicit) return explicit;
  return buildMisDirectorWarehouseUrl();
}

/** ตรวจว่าเป็น URL กลับไป MIS ที่ใช้ได้ */
export function sanitizeMisReturnUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    // บังคับไปหน้าตัวชี้วัดผู้อำนวยการ · ทรัพยากรคลัง บน origin นั้น
    return buildMisDirectorWarehouseUrl(u.origin);
  } catch {
    return null;
  }
}
