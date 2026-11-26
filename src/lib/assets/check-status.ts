import type { Prisma } from "@prisma/client";

export const CHECK_STATUSES = [
  { code: "IN_USE", name: "ใช้อยู่", field: "checkInUse" },
  { code: "DAMAGED", name: "ชำรุด", field: "checkDamaged" },
  { code: "DETERIORATED", name: "เสื่อมสภาพ", field: "checkDeteriorated" },
  { code: "LOST", name: "สูญไป", field: "checkLost" },
  { code: "UNUSED", name: "ไม่ใช้", field: "checkUnused" },
  { code: "UNSET", name: "ไม่ระบุ", field: null },
] as const;

export type CheckStatusCode = (typeof CHECK_STATUSES)[number]["code"];

export function parseCheckStatus(
  value?: string,
): CheckStatusCode | undefined {
  const code = value?.trim().toUpperCase();
  if (!code) return undefined;
  if (code === "NONE" || code === "UNSET") return "UNSET";
  return CHECK_STATUSES.find((s) => s.code === code)?.code;
}

export function checkStatusWhere(
  code?: CheckStatusCode,
): Prisma.AssetWhereInput {
  switch (code) {
    case "IN_USE":
      return { checkInUse: true };
    case "DAMAGED":
      return { checkDamaged: true };
    case "DETERIORATED":
      return { checkDeteriorated: true };
    case "LOST":
      return { checkLost: true };
    case "UNUSED":
      return { checkUnused: true };
    case "UNSET":
      return {
        checkInUse: false,
        checkDamaged: false,
        checkDeteriorated: false,
        checkLost: false,
        checkUnused: false,
      };
    default:
      return {};
  }
}

export function checkStatusLabel(code?: CheckStatusCode) {
  return CHECK_STATUSES.find((s) => s.code === code)?.name;
}
