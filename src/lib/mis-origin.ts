/** ลิงก์กลับไป dashboard หลักของ TSL MIS (erptsl) */

export const DEFAULT_MIS_ORIGIN = "http://183.89.210.168:3000";
export const MIS_FROM_COOKIE = "tsl_from_mis";

export function getMisOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_MIS_ORIGIN?.trim() ||
    process.env.MIS_ORIGIN?.trim() ||
    DEFAULT_MIS_ORIGIN;
  return raw.replace(/\/+$/, "");
}

/** หน้าตัวชี้วัดผู้อำนวยการ · แท็บทรัพยากรคลัง */
export function getMisDirectorWarehouseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_MIS_DASHBOARD_URL?.trim();
  if (explicit) return explicit;
  return `${getMisOrigin()}/dashboard?nav=director-kpi&tab=warehouse`;
}
