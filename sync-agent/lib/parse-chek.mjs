import * as XLSX from "xlsx";
import { createHash } from "node:crypto";

const THAI_MONTHS = {
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

function clean(value) {
  if (value == null) return "";
  return String(value).replace(/\u00a0/g, " ").trim();
}

function toNumber(value) {
  if (!value || value === "-" || value === ".") return null;
  const n = Number(String(value).replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toInt(value) {
  const n = toNumber(value);
  return n == null ? null : Math.trunc(n);
}

function marked(value) {
  const s = clean(value);
  return Boolean(s && s !== "-" && s !== "0" && s !== "false");
}

function normalizeHeader(h) {
  return h.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

function findHeaderIndex(headers, aliases) {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    const idx = normalized.findIndex((h) => h === target);
    if (idx >= 0) return idx;
  }
  for (const alias of aliases) {
    const target = normalizeHeader(alias);
    if (target.length < 4) continue;
    const idx = normalized.findIndex((h) => h.includes(target));
    if (idx >= 0) return idx;
  }
  return -1;
}

function monthNameFromNumber(n) {
  return Object.entries(THAI_MONTHS).find(([, v]) => v === n)?.[0] ?? null;
}

function normalizeThaiMonth(monthName) {
  if (!monthName) return null;
  const cleaned = String(monthName).replace(/\s+/g, "").trim();
  if (THAI_MONTHS[cleaned]) return cleaned;
  const asNum = Number(cleaned);
  if (Number.isInteger(asNum) && asNum >= 1 && asNum <= 12) {
    return monthNameFromNumber(asNum);
  }
  return null;
}

function parseChekDateText(text) {
  const raw = clean(text);
  if (!raw || raw === "-") return null;

  const thai = raw.match(/^(\d{1,2})\s+([^\d/\s]+)\s+(\d{4})$/);
  if (thai) {
    const day = Number(thai[1]);
    const month = normalizeThaiMonth(thai[2]);
    const yearBe = Number(thai[3]);
    if (month && yearBe >= 2400) {
      return { day: day >= 1 && day <= 31 ? day : 1, month, yearBe };
    }
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = monthNameFromNumber(Number(slash[2]));
    const yearBe = Number(slash[3]);
    if (month && yearBe >= 2400) {
      return { day: day >= 1 && day <= 31 ? day : 1, month, yearBe };
    }
  }
  return null;
}

function extractTypeCode(assetCode) {
  if (!assetCode) return null;
  const m = assetCode.match(/^(\d{4}-\d{3}-\d{4})/);
  return m?.[1] ?? null;
}

function normalizeCategoryName(value) {
  if (!value) return null;
  return value.split("ครุัณฑ์").join("ครุภัณฑ์");
}

export function contentHash(row) {
  const payload = [
    row.assetCode,
    row.assetClass,
    row.typeCode,
    row.seqNo,
    row.yearCode,
    row.categoryName,
    row.itemName,
    row.acquireMethod,
    row.brandModel,
    row.locationText,
    row.receiveDay,
    row.receiveMonth,
    row.receiveYearBe,
    row.unitPrice,
    row.quantity,
    row.checkDamaged,
    row.checkDeteriorated,
    row.checkLost,
    row.checkUnused,
    row.checkInUse,
    row.checkRemark,
  ].join("|");
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

export function parseChekFile(buffer, assetClass) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: false });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "chek") ||
    wb.SheetNames.find((n) => n.toLowerCase() === "check") ||
    wb.SheetNames.find((n) => /che?ck/i.test(n));
  if (!sheetName) return { sheetName: null, rows: [] };

  const matrix = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
  });

  let headerIdx = -1;
  for (let i = 0; i < Math.min(12, matrix.length); i++) {
    const row = (matrix[i] || []).map(clean);
    if (
      findHeaderIndex(row, ["รหัสครุภัณฑ์"]) >= 0 &&
      (findHeaderIndex(row, ["ชำรุด"]) >= 0 ||
        findHeaderIndex(row, ["รายการครุภัณฑ์"]) >= 0)
    ) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return { sheetName, rows: [] };

  const headerRow = (matrix[headerIdx] || []).map(clean);
  const idx = {
    seqNo: findHeaderIndex(headerRow, ["ลำดับที่"]),
    categoryName: findHeaderIndex(headerRow, ["ประเภทครุภัณฑ์"]),
    itemName: findHeaderIndex(headerRow, ["รายการครุภัณฑ์"]),
    assetCode: findHeaderIndex(headerRow, ["รหัสครุภัณฑ์"]),
    brandModel: findHeaderIndex(headerRow, [
      "แบบ/รุ่น/ยี่ห้อ",
      "รุ่น / แบบ / ยี่ห้อ",
    ]),
    acquiredText: findHeaderIndex(headerRow, ["ที่ได้มา", "วันที่ได้มา"]),
    acquireMethod: findHeaderIndex(headerRow, ["วิธีการได้มา"]),
    unitPrice: findHeaderIndex(headerRow, ["ทะเบียน", "ราคาตามทะเบียน"]),
    locationText: findHeaderIndex(headerRow, [
      "ผู้ใช้งาน",
      "สถานที่ตั้ง/ผู้รับผิดชอบ",
    ]),
    damaged: findHeaderIndex(headerRow, ["ชำรุด"]),
    deteriorated: findHeaderIndex(headerRow, ["เสื่อมสภาพ"]),
    lost: findHeaderIndex(headerRow, ["สูญไป"]),
    unused: findHeaderIndex(headerRow, ["ไม่ใช้"]),
    inUse: findHeaderIndex(headerRow, ["ใช้อยู่"]),
    remark: findHeaderIndex(headerRow, ["หมายเหตุ"]),
    altDate: headerRow.findIndex(
      (h, i) => i > 15 && (!h || /^คอลัมน์\d+$/i.test(h)),
    ),
  };

  const get = (line, col) => (col >= 0 ? clean(line[col]) : "");
  /** Last row wins when Excel has duplicate asset codes. */
  const byCode = new Map();

  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const line = matrix[i] || [];
    const assetCode = get(line, idx.assetCode) || null;
    const itemName = get(line, idx.itemName) || null;
    if (!assetCode && !itemName) continue;

    const acquired =
      parseChekDateText(get(line, idx.acquiredText)) ||
      parseChekDateText(get(line, idx.altDate));

    const row = {
      assetCode,
      assetClass,
      typeCode: extractTypeCode(assetCode),
      seqNo: toInt(get(line, idx.seqNo)),
      yearCode: acquired?.yearBe != null ? String(acquired.yearBe) : null,
      categoryName: normalizeCategoryName(get(line, idx.categoryName) || null),
      itemName,
      acquireMethod: get(line, idx.acquireMethod) || null,
      brandModel: get(line, idx.brandModel) || null,
      locationText: get(line, idx.locationText) || null,
      receiveDay: acquired?.day ?? null,
      receiveMonth: acquired?.month ?? null,
      receiveYearBe: acquired?.yearBe ?? null,
      unitPrice: toNumber(get(line, idx.unitPrice)),
      quantity: 1,
      checkDamaged: idx.damaged >= 0 ? marked(line[idx.damaged]) : false,
      checkDeteriorated:
        idx.deteriorated >= 0 ? marked(line[idx.deteriorated]) : false,
      checkLost: idx.lost >= 0 ? marked(line[idx.lost]) : false,
      checkUnused: idx.unused >= 0 ? marked(line[idx.unused]) : false,
      checkInUse: idx.inUse >= 0 ? marked(line[idx.inUse]) : false,
      checkRemark: idx.remark >= 0 ? get(line, idx.remark) || null : null,
    };
    row.contentHash = contentHash(row);
    const key = assetCode || `__row_${i}`;
    byCode.set(key, row);
  }

  return { sheetName, rows: [...byCode.values()] };
}
