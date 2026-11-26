import * as XLSX from "xlsx";
import { z } from "zod";
import { fixThaiMojibake } from "@/lib/text/thai-mojibake";

export const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1,
  กุมภาพันธ์: 2,
  มีนาคม: 3,
  เมษายน: 4,
  พฤษภาคม: 5,
  มิถุนายน: 6,
  กรกฎาคม: 7,
  สิงหาคม: 8,
  กันยายน: 9,
  ตุลาคม: 10,
  พฤศจิกายน: 11,
  ธันวาคม: 12,
};

export type ParsedAssetRow = {
  rowNo: number;
  raw: Record<string, string>;
  typeCode: string | null;
  acquireSeq: string | null;
  yearCode: string | null;
  seqNo: number | null;
  categoryName: string | null;
  itemName: string | null;
  assetCode: string | null;
  usefulLifeYears: number | null;
  budgetType: string | null;
  acquireMethod: string | null;
  brandModel: string | null;
  locationText: string | null;
  documentRef: string | null;
  receiveDay: number | null;
  receiveMonth: string | null;
  receiveYearBe: number | null;
  quantity: number | null;
  unitPrice: number | null;
  unitName: string | null;
  calculateDepreciation: boolean | null;
  vendorName: string | null;
  vendorAddress: string | null;
  vendorPhone: string | null;
};

const HEADER_ALIASES = {
  typeCode: ["กำหนดรหัสครุภัณฑ์"],
  acquireSeq: ["ลำดับที่ได้มา"],
  yearCode: ["ปีที่ได้รับ", "ปีที่\r\nได้รับ"],
  seqNo: ["ที่"],
  categoryName: ["ประเภทครุภัณฑ์"],
  itemName: ["เลือกลักษณะ / คุณสมบัติ (ชนิด)", "เลือกลักษณะ / \r\nคุณสมบัติ (ชนิด)"],
  assetCode: ["รหัสอาคาร/ครุภัณฑ์"],
  usefulLifeYears: ["อายุการใช้งาน(ปี)", "อายุการ\r\nใช้งาน(ปี)"],
  budgetType: ["ประเภทเงิน"],
  acquireMethod: ["วิธีการได้มา"],
  brandModel: ["รุ่น / แบบ / ยี่ห้อ"],
  locationText: ["สถานที่ตั้ง/ผู้รับผิดชอบ"],
  documentRef: ["เอกสารที่ได้รับ"],
  receiveDay: ["วันที่"],
  receiveMonth: ["เดือน"],
  receiveYearBe: ["พ.ศ."],
  quantity: ["จำนวนที่ได้รับ", "จำนวน\r\nที่ได้รับ"],
  unitPrice: ["ราคาต่อหน่วย", " ราคา\r\nต่อหน่วย "],
  unitName: ["หน่วย"],
  calculateDepreciation: ["ต้องการคำนวนค่าเสื่อมหรือไม่", "ต้องการคำนวน\r\nค่าเสื่อมหรือไม่"],
  vendorName: ["ชื่อผู้ขาย/รับจ้าง/บริจาค"],
  vendorHouseNo: ["เลขที่ หมู่ที่"],
  vendorRoad: ["ถนน"],
  vendorSubdistrict: ["ตำบล/แขวง"],
  vendorDistrict: ["อำเภอ"],
  vendorProvince: ["จังหวัด"],
  vendorPhone: ["โทรศัพท์"],
} as const;

function clean(value: unknown): string {
  if (value == null) return "";
  const text = String(value).replace(/\u00a0/g, " ").trim();
  return fixThaiMojibake(text) ?? text;
}

/** Excel source often misspells ครุภัณฑ์ as ครุัณฑ์ (missing พ). */
function normalizeCategoryName(value: string | null): string | null {
  if (!value) return null;
  return value.split("ครุัณฑ์").join("ครุภัณฑ์");
}

function normalizeHeader(h: string) {
  return h.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function toNumber(value: string): number | null {
  if (!value || value === "-" || value === ".") return null;
  const n = Number(value.replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toInt(value: string): number | null {
  const n = toNumber(value);
  return n == null ? null : Math.trunc(n);
}

function findHeaderIndex(headers: string[], aliases: readonly string[]) {
  const normalized = headers.map((h) => normalizeHeader(h));

  // 1) exact match first
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    const idx = normalized.findIndex((h) => h === target);
    if (idx >= 0) return idx;
  }

  // 2) header contains the full alias (alias must be meaningful length)
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    if (target.length < 4) continue;
    const idx = normalized.findIndex((h) => h.includes(target));
    if (idx >= 0) return idx;
  }

  // 3) alias contains header — only for long headers (กัน match คอลัมน์สั้นอย่าง "ที่")
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    const idx = normalized.findIndex(
      (h) => h.length >= 8 && target.includes(h),
    );
    if (idx >= 0) return idx;
  }

  return -1;
}

/** Ordered character overlap — recovers months mangled by charset/mojibake. */
function monthSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;
  if (longer.includes(shorter) && shorter.length >= 3) {
    return shorter.length / longer.length;
  }
  let matches = 0;
  let bi = 0;
  for (let i = 0; i < shorter.length; i++) {
    const found = longer.indexOf(shorter[i]!, bi);
    if (found >= 0) {
      matches += 1;
      bi = found + 1;
    }
  }
  return matches / longer.length;
}

/**
 * Normalize Excel/DB month labels to a canonical Thai month name.
 * Handles mojibake, missing ภ (U+FFFD), numeric 1–12, and near-matches.
 */
export function normalizeThaiMonth(
  monthName: string | null | undefined,
): string | null {
  if (!monthName) return null;
  const cleaned = (fixThaiMojibake(monthName) ?? monthName)
    .replace(/\s+/g, "")
    .replace(/[\u0000-\u001F\u007F-\u009F\uFFFD]/g, "")
    .trim();
  if (!cleaned) return null;
  if (THAI_MONTHS[cleaned]) return cleaned;

  const asNum = Number(cleaned);
  if (Number.isInteger(asNum) && asNum >= 1 && asNum <= 12) {
    return (
      Object.entries(THAI_MONTHS).find(([, n]) => n === asNum)?.[0] ?? null
    );
  }

  let best: string | null = null;
  let bestScore = 0;
  for (const name of Object.keys(THAI_MONTHS)) {
    const score = monthSimilarity(cleaned, name);
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }
  return bestScore >= 0.55 ? best : null;
}

export function buildReceivedAt(
  day: number | null,
  monthName: string | null,
  yearBe: number | null,
): Date | null {
  if (!yearBe) return null;
  const normalized = monthName ? normalizeThaiMonth(monthName) : null;
  const month = normalized ? THAI_MONTHS[normalized] : monthName ? null : 1;
  if (!month) return null;
  const d = day && day >= 1 && day <= 31 ? day : 1;
  const yearCe = yearBe > 2400 ? yearBe - 543 : yearBe;
  const date = new Date(Date.UTC(yearCe, month - 1, d));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseAssetWorkbook(
  buffer: Buffer,
  sheetName = "Data",
): { sheetName: string; rows: ParsedAssetRow[] } {
  const wb = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });

  const resolvedSheet =
    wb.SheetNames.find((n) => n === sheetName) ||
    wb.SheetNames.find((n) => n.includes("Data")) ||
    wb.SheetNames[0];

  if (!resolvedSheet) {
    throw new Error("ไม่พบชีตข้อมูลในไฟล์ Excel");
  }

  const ws = wb.Sheets[resolvedSheet];
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length < 4) {
    throw new Error("ไฟล์ Excel ไม่มีแถวข้อมูลเพียงพอ (ต้องการหัวตารางแถวที่ 3)");
  }

  const headerRow = (matrix[2] || []).map((c) => clean(c));
  const indexMap = Object.fromEntries(
    Object.entries(HEADER_ALIASES).map(([key, aliases]) => [
      key,
      findHeaderIndex(headerRow, aliases),
    ]),
  ) as Record<keyof typeof HEADER_ALIASES, number>;

  if (indexMap.assetCode < 0 && indexMap.itemName < 0) {
    throw new Error("ไม่พบคอลัมน์รหัสครุภัณฑ์หรือชื่อชนิดในชีต Data");
  }

  const rows: ParsedAssetRow[] = [];

  for (let i = 3; i < matrix.length; i++) {
    const line = matrix[i] || [];
    const get = (key: keyof typeof HEADER_ALIASES) => {
      const idx = indexMap[key];
      return idx >= 0 ? clean(line[idx]) : "";
    };

    const assetCode = get("assetCode") || null;
    const itemName = get("itemName") || null;
    if (!assetCode && !itemName) continue;

    const vendorParts = [
      get("vendorHouseNo"),
      get("vendorRoad"),
      get("vendorSubdistrict"),
      get("vendorDistrict"),
      get("vendorProvince"),
    ]
      .map((p) => (p === "-" ? "" : p))
      .filter(Boolean);

    const depRaw = get("calculateDepreciation");
    let calculateDepreciation: boolean | null = null;
    if (depRaw) {
      calculateDepreciation = depRaw.includes("คำนวณ") && !depRaw.includes("ไม่คำนวณ");
      if (depRaw.includes("ไม่คำนวณ")) calculateDepreciation = false;
    }

    const raw: Record<string, string> = {};
    headerRow.forEach((h, idx) => {
      if (!h) return;
      raw[h] = clean(line[idx]);
    });

    rows.push({
      rowNo: i + 1,
      raw,
      typeCode: get("typeCode") || null,
      acquireSeq: get("acquireSeq") || null,
      yearCode: get("yearCode") || null,
      seqNo: toInt(get("seqNo")),
      categoryName: normalizeCategoryName(get("categoryName") || null),
      itemName,
      assetCode,
      usefulLifeYears: toInt(get("usefulLifeYears")),
      budgetType: get("budgetType") || null,
      acquireMethod: get("acquireMethod") || null,
      brandModel: get("brandModel") || null,
      locationText: get("locationText") || null,
      documentRef: get("documentRef") || null,
      receiveDay: toInt(get("receiveDay")),
      receiveMonth: normalizeThaiMonth(get("receiveMonth") || null),
      receiveYearBe: toInt(get("receiveYearBe")),
      quantity: toNumber(get("quantity")),
      unitPrice: toNumber(get("unitPrice")),
      unitName: get("unitName") || null,
      calculateDepreciation,
      vendorName: (() => {
        const v = get("vendorName");
        if (!v || v === "-") return null;
        return v.replace(/\+[A-Z]+\d+:[A-Z]+\d+$/i, "").trim() || null;
      })(),
      vendorAddress: vendorParts.length ? vendorParts.join(" ") : null,
      vendorPhone: (() => {
        const p = get("vendorPhone");
        return !p || p === "-" ? null : p;
      })(),
    });
  }

  return { sheetName: resolvedSheet, rows };
}

export type AssetCheckFlags = {
  assetCode: string;
  checkDamaged: boolean;
  checkDeteriorated: boolean;
  checkLost: boolean;
  checkUnused: boolean;
  checkInUse: boolean;
  checkRemark: string | null;
};

/** Full registry row from sheet chek (preferred system source). */
export type ParsedChekRow = ParsedAssetRow & AssetCheckFlags;

function isCheckMarked(value: unknown): boolean {
  const s = clean(value);
  if (!s || s === "-" || s === "0" || s === "false") return false;
  return true;
}

function monthNameFromNumber(n: number): string | null {
  return Object.entries(THAI_MONTHS).find(([, v]) => v === n)?.[0] ?? null;
}

/** Parse "28 กุมภาพันธ์ 2561" or "28/2/2561". */
export function parseChekDateText(text: string | null | undefined): {
  day: number | null;
  month: string | null;
  yearBe: number | null;
} | null {
  const raw = clean(text);
  if (!raw || raw === "-") return null;

  const thai = raw.match(/^(\d{1,2})\s+([^\d/\s]+)\s+(\d{4})$/);
  if (thai) {
    const day = Number(thai[1]);
    const month = normalizeThaiMonth(thai[2] ?? null);
    const yearBe = Number(thai[3]);
    if (month && yearBe >= 2400) {
      return {
        day: day >= 1 && day <= 31 ? day : 1,
        month,
        yearBe,
      };
    }
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = monthNameFromNumber(Number(slash[2]));
    const yearBe = Number(slash[3]);
    if (month && yearBe >= 2400) {
      return {
        day: day >= 1 && day <= 31 ? day : 1,
        month,
        yearBe,
      };
    }
  }

  return null;
}

function extractTypeCode(assetCode: string | null): string | null {
  if (!assetCode) return null;
  const m = assetCode.match(/^(\d{4}-\d{3}-\d{4})/);
  return m?.[1] ?? null;
}

function findChekSheetName(sheetNames: string[]): string | undefined {
  return (
    sheetNames.find((n) => n.toLowerCase() === "chek") ||
    sheetNames.find((n) => n.toLowerCase() === "check") ||
    sheetNames.find((n) => /che?ck/i.test(n))
  );
}

/**
 * Parse sheet "chek" / "check" as the primary asset registry source:
 * ประเภท, รายการ, รหัส, รุ่น, วันที่ได้มา, วิธีการได้มา, ราคา, ผู้ใช้งาน, สถานะตรวจ
 */
export function parseChekAssetWorkbook(buffer: Buffer): {
  sheetName: string;
  rows: ParsedChekRow[];
} | null {
  const wb = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });

  const sheetName = findChekSheetName(wb.SheetNames);
  if (!sheetName) return null;

  const ws = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
  });

  let headerIdx = -1;
  for (let i = 0; i < Math.min(12, matrix.length); i++) {
    const row = (matrix[i] || []).map((c) => clean(c));
    if (
      findHeaderIndex(row, ["รหัสครุภัณฑ์"]) >= 0 &&
      (findHeaderIndex(row, ["ชำรุด"]) >= 0 ||
        findHeaderIndex(row, ["รายการครุภัณฑ์"]) >= 0)
    ) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return null;

  const headerRow = (matrix[headerIdx] || []).map((c) => clean(c));
  const idx = {
    seqNo: findHeaderIndex(headerRow, ["ลำดับที่"]),
    categoryName: findHeaderIndex(headerRow, ["ประเภทครุภัณฑ์"]),
    itemName: findHeaderIndex(headerRow, ["รายการครุภัณฑ์"]),
    assetCode: findHeaderIndex(headerRow, ["รหัสครุภัณฑ์"]),
    brandModel: findHeaderIndex(headerRow, ["แบบ/รุ่น/ยี่ห้อ", "รุ่น / แบบ / ยี่ห้อ"]),
    acquiredText: findHeaderIndex(headerRow, ["ที่ได้มา", "วันที่ได้มา"]),
    acquireMethod: findHeaderIndex(headerRow, ["วิธีการได้มา"]),
    unitPrice: findHeaderIndex(headerRow, ["ทะเบียน", "ราคาตามทะเบียน"]),
    locationText: findHeaderIndex(headerRow, ["ผู้ใช้งาน", "สถานที่ตั้ง/ผู้รับผิดชอบ"]),
    damaged: findHeaderIndex(headerRow, ["ชำรุด"]),
    deteriorated: findHeaderIndex(headerRow, ["เสื่อมสภาพ"]),
    lost: findHeaderIndex(headerRow, ["สูญไป"]),
    unused: findHeaderIndex(headerRow, ["ไม่ใช้"]),
    inUse: findHeaderIndex(headerRow, ["ใช้อยู่"]),
    remark: findHeaderIndex(headerRow, ["หมายเหตุ"]),
    // often unlabeled date column after หมายเหตุ (คอลัมน์1) = d/m/yyyy BE
    altDate: headerRow.findIndex(
      (h, i) =>
        i > 15 &&
        (!h || /^คอลัมน์\d+$/i.test(h) || h === "วัน/เดือน/ปี"),
    ),
  };

  if (idx.assetCode < 0 && idx.itemName < 0) return null;

  const get = (line: (string | number)[], col: number) =>
    col >= 0 ? clean(line[col]) : "";

  const rows: ParsedChekRow[] = [];
  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const line = matrix[i] || [];
    const assetCode = get(line, idx.assetCode) || null;
    const itemName = get(line, idx.itemName) || null;
    if (!assetCode && !itemName) continue;

    const acquired =
      parseChekDateText(get(line, idx.acquiredText)) ||
      parseChekDateText(get(line, idx.altDate));

    const priceRaw = get(line, idx.unitPrice);
    const unitPrice = toNumber(priceRaw);
    // Each chek row is one asset unit; มูลค่าทรัพย์สิน is not quantity.
    const quantity = 1;

    const raw: Record<string, string> = {};
    headerRow.forEach((h, col) => {
      if (!h) return;
      raw[h] = clean(line[col]);
    });

    rows.push({
      rowNo: i + 1,
      raw,
      typeCode: extractTypeCode(assetCode),
      acquireSeq: null,
      yearCode: acquired?.yearBe != null ? String(acquired.yearBe) : null,
      seqNo: toInt(get(line, idx.seqNo)),
      categoryName: normalizeCategoryName(get(line, idx.categoryName) || null),
      itemName,
      assetCode: assetCode || "",
      usefulLifeYears: null,
      budgetType: null,
      acquireMethod: get(line, idx.acquireMethod) || null,
      brandModel: get(line, idx.brandModel) || null,
      locationText: get(line, idx.locationText) || null,
      documentRef: null,
      receiveDay: acquired?.day ?? null,
      receiveMonth: acquired?.month ?? null,
      receiveYearBe: acquired?.yearBe ?? null,
      quantity: quantity != null && quantity > 0 ? quantity : 1,
      unitPrice,
      unitName: null,
      calculateDepreciation: true,
      vendorName: null,
      vendorAddress: null,
      vendorPhone: null,
      checkDamaged: idx.damaged >= 0 ? isCheckMarked(line[idx.damaged]) : false,
      checkDeteriorated:
        idx.deteriorated >= 0 ? isCheckMarked(line[idx.deteriorated]) : false,
      checkLost: idx.lost >= 0 ? isCheckMarked(line[idx.lost]) : false,
      checkUnused: idx.unused >= 0 ? isCheckMarked(line[idx.unused]) : false,
      checkInUse: idx.inUse >= 0 ? isCheckMarked(line[idx.inUse]) : false,
      checkRemark: idx.remark >= 0 ? get(line, idx.remark) || null : null,
    });
  }

  return { sheetName, rows };
}

/** Flags-only helper (backward compatible). */
export function parseChekWorkbook(buffer: Buffer): AssetCheckFlags[] {
  const parsed = parseChekAssetWorkbook(buffer);
  if (!parsed) return [];
  return parsed.rows.map((row) => ({
    assetCode: row.assetCode || "",
    checkDamaged: row.checkDamaged,
    checkDeteriorated: row.checkDeteriorated,
    checkLost: row.checkLost,
    checkUnused: row.checkUnused,
    checkInUse: row.checkInUse,
    checkRemark: row.checkRemark,
  }));
}

/**
 * Prefer sheet chek as system source; fall back to Data when chek is absent.
 */
export function parseRegistryWorkbook(buffer: Buffer): {
  sheetName: string;
  rows: ParsedAssetRow[];
  source: "chek" | "data";
} {
  const chek = parseChekAssetWorkbook(buffer);
  if (chek && chek.rows.length > 0) {
    return { sheetName: chek.sheetName, rows: chek.rows, source: "chek" };
  }
  const data = parseAssetWorkbook(buffer, "Data");
  return { sheetName: data.sheetName, rows: data.rows, source: "data" };
}

export function checkFlagsByAssetCode(
  rows: AssetCheckFlags[],
): Map<string, AssetCheckFlags> {
  const map = new Map<string, AssetCheckFlags>();
  for (const row of rows) {
    if (!row.assetCode) continue;
    map.set(row.assetCode, row);
  }
  return map;
}

export const assetRowValidationSchema = z.object({
  assetCode: z.string().min(1, "ต้องมีรหัสอาคาร/ครุภัณฑ์"),
  itemName: z.string().min(1, "ต้องมีชื่อชนิดครุภัณฑ์"),
  categoryName: z.string().optional().nullable(),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0").optional().nullable(),
  unitPrice: z.number().nonnegative("ราคาต้องไม่ติดลบ").optional().nullable(),
});

export type RowValidationResult = {
  status: "VALID" | "WARNING" | "ERROR";
  errors: string[];
  warnings: string[];
};

export function validateParsedRow(
  row: ParsedAssetRow,
  options?: {
    existingCodes?: Set<string>;
    duplicateInBatch?: Set<string>;
    assetClass?: "NORMAL" | "LOW_VALUE";
    lowValueThreshold?: number;
  },
): RowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = assetRowValidationSchema.safeParse({
    assetCode: row.assetCode,
    itemName: row.itemName,
    categoryName: row.categoryName,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(issue.message);
    }
  }

  if (row.assetCode && options?.duplicateInBatch?.has(row.assetCode)) {
    errors.push(`รหัสซ้ำในไฟล์นำเข้า: ${row.assetCode}`);
  }

  if (row.assetCode && options?.existingCodes?.has(row.assetCode)) {
    warnings.push("พบรหัสนี้ในระบบแล้ว จะอัปเดตเมื่อยืนยันนำเข้า");
  }

  if (row.receiveMonth && !normalizeThaiMonth(row.receiveMonth)) {
    warnings.push(`เดือนไม่รู้จัก: ${row.receiveMonth}`);
  }

  if (row.receiveYearBe && (row.receiveYearBe < 2400 || row.receiveYearBe > 2800)) {
    warnings.push(`ปี พ.ศ. ผิดปกติ: ${row.receiveYearBe}`);
  }

  const threshold = options?.lowValueThreshold ?? 10000;
  if (row.unitPrice != null && options?.assetClass === "NORMAL" && row.unitPrice < threshold) {
    warnings.push(`ราคาน้อยกว่าเกณฑ์ ${threshold.toLocaleString("th-TH")} บาท แต่นำเข้าเป็นครุภัณฑ์ปกติ`);
  }
  if (row.unitPrice != null && options?.assetClass === "LOW_VALUE" && row.unitPrice >= threshold) {
    warnings.push(`ราคามากกว่าหรือเท่าเกณฑ์ ${threshold.toLocaleString("th-TH")} บาท แต่นำเข้าเป็นต่ำกว่าเกณฑ์`);
  }

  if (!row.locationText) warnings.push("ไม่มีสถานที่ตั้ง/ผู้รับผิดชอบ");
  if (!row.categoryName) warnings.push("ไม่มีประเภทครุภัณฑ์");

  if (errors.length > 0) return { status: "ERROR", errors, warnings };
  if (warnings.length > 0) return { status: "WARNING", errors, warnings };
  return { status: "VALID", errors, warnings };
}
