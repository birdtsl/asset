/**
 * Sync asset registry fields from Excel sheet "chek" (system source of truth).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma.ts";
import {
  buildReceivedAt,
  parseChekAssetWorkbook,
} from "../src/lib/excel/asset-import.ts";

const importDir = path.resolve("storage/imports");
const files = [
  {
    file: "2026-11-20T08-00-07-332Z_ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่.xlsm",
    assetClass: "NORMAL",
  },
  {
    file: "2026-11-20T08-00-22-767Z_ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่าเกณฑ์.xlsm",
    assetClass: "LOW_VALUE",
  },
];

const byCode = new Map();

for (const entry of files) {
  const full = path.join(importDir, entry.file);
  if (!fs.existsSync(full)) {
    console.warn("missing", entry.file);
    continue;
  }
  const parsed = parseChekAssetWorkbook(fs.readFileSync(full));
  if (!parsed) {
    console.warn("no chek sheet", entry.file);
    continue;
  }
  console.log(entry.file, "chek rows:", parsed.rows.length);
  for (const row of parsed.rows) {
    if (!row.assetCode) continue;
    byCode.set(row.assetCode, { ...row, assetClass: entry.assetClass });
  }
}

let matched = 0;
let updated = 0;
let created = 0;
let skipped = 0;

for (const [assetCode, row] of byCode) {
  const existing = await prisma.asset.findFirst({
    where: { assetCode },
    select: { id: true },
  });

  const receiveMonth = row.receiveMonth;
  const receivedAt = buildReceivedAt(
    row.receiveDay,
    receiveMonth,
    row.receiveYearBe,
  );
  const quantity = row.quantity != null && row.quantity > 0 ? row.quantity : 1;
  const unitPrice = row.unitPrice;
  const totalValue =
    unitPrice != null ? Number((quantity * unitPrice).toFixed(2)) : null;

  const data = {
    assetClass: row.assetClass,
    typeCode: row.typeCode,
    seqNo: row.seqNo,
    yearCode: row.yearCode,
    categoryName: row.categoryName,
    itemName: row.itemName || assetCode,
    acquireMethod: row.acquireMethod,
    brandModel: row.brandModel,
    locationText: row.locationText,
    receiveDay: row.receiveDay,
    receiveMonth,
    receiveYearBe: row.receiveYearBe,
    receivedAt,
    quantity: new Prisma.Decimal(quantity),
    unitPrice: unitPrice != null ? new Prisma.Decimal(unitPrice) : null,
    totalValue: totalValue != null ? new Prisma.Decimal(totalValue) : null,
    checkDamaged: row.checkDamaged,
    checkDeteriorated: row.checkDeteriorated,
    checkLost: row.checkLost,
    checkUnused: row.checkUnused,
    checkInUse: row.checkInUse,
    checkRemark: row.checkRemark,
    isActive: true,
  };

  if (!row.itemName) {
    skipped += 1;
    continue;
  }

  if (existing) {
    matched += 1;
    await prisma.asset.update({ where: { id: existing.id }, data });
    updated += 1;
  } else {
    await prisma.asset.create({
      data: {
        assetCode,
        ...data,
      },
    });
    created += 1;
  }
}

const counts = await prisma.$queryRaw`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN received_at IS NULL THEN 1 ELSE 0 END) AS no_received,
    SUM(CASE WHEN check_damaged THEN 1 ELSE 0 END) AS damaged,
    SUM(CASE WHEN check_in_use THEN 1 ELSE 0 END) AS in_use,
    SUM(CASE WHEN location_text IS NOT NULL AND location_text <> '' THEN 1 ELSE 0 END) AS has_location
  FROM assets
`;

console.log(
  JSON.stringify(
    {
      uniqueChek: byCode.size,
      matched,
      updated,
      created,
      skipped,
      counts: counts.map((r) =>
        Object.fromEntries(
          Object.entries(r).map(([k, v]) => [k, Number(v)]),
        ),
      ),
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
