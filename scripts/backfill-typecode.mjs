/**
 * Backfill missing typeCode / repair acquireSeq from staging raw_json
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function isBroken(s) {
  if (!s) return false;
  if (/[\u0080-\u009F]/.test(s)) return true;
  const triples = (s.match(/เธ./g) || []).length;
  const thai = (s.match(/[\u0E00-\u0E7F]/g) || []).length;
  return thai >= 4 && triples >= 1 && triples * 2 >= thai * 0.4;
}
function fixThai(s) {
  if (!s || !isBroken(s)) return s;
  const out = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfffd) out.push(0xa0);
    else if (cp <= 0x9f) out.push(cp);
    else if (cp >= 0x0e01 && cp <= 0x0e5b) out.push(cp - 0x0e00 + 0xa0);
    else for (const b of Buffer.from(ch, "utf8")) out.push(b);
  }
  const fixed = Buffer.from(out).toString("utf8");
  return fixed.includes("\uFFFD") ? s : fixed;
}

function pick(raw, includes) {
  const key = Object.keys(raw || {}).find((k) =>
    includes.some((p) => String(k).replace(/\s+/g, " ").includes(p)),
  );
  if (!key) return null;
  const v = String(raw[key] ?? "").trim();
  return v && v !== "-" ? fixThai(v) : null;
}

const u = new URL(process.env.DATABASE_URL);
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
  }),
});

const staging = await prisma.importStagingRow.findMany({
  select: {
    id: true,
    batchId: true,
    rowNo: true,
    assetCode: true,
    typeCode: true,
    acquireSeq: true,
    matchedAssetId: true,
    rawJson: true,
  },
});

let assetUpdated = 0;
let stagingUpdated = 0;

for (const row of staging) {
  let raw = {};
  try {
    raw = JSON.parse(row.rawJson || "{}");
  } catch {
    continue;
  }

  const typeCode = pick(raw, ["กำหนดรหัสครุภัณฑ์"]) || row.typeCode;
  const acquireSeq = pick(raw, ["ลำดับที่ได้มา"]) || row.acquireSeq;

  const stagingData = {};
  if (typeCode && typeCode !== row.typeCode) stagingData.typeCode = typeCode;
  if (acquireSeq && acquireSeq !== row.acquireSeq) {
    stagingData.acquireSeq = acquireSeq;
  }
  if (Object.keys(stagingData).length) {
    await prisma.importStagingRow.update({
      where: { id: row.id },
      data: stagingData,
    });
    stagingUpdated += 1;
  }

  let asset =
    (row.matchedAssetId &&
      (await prisma.asset.findUnique({
        where: { id: row.matchedAssetId },
        select: { id: true, typeCode: true, acquireSeq: true },
      }))) ||
    (await prisma.asset.findFirst({
      where: { sourceBatchId: row.batchId, sourceRowNo: row.rowNo },
      select: { id: true, typeCode: true, acquireSeq: true },
    })) ||
    (row.assetCode
      ? await prisma.asset.findFirst({
          where: { assetCode: row.assetCode },
          select: { id: true, typeCode: true, acquireSeq: true },
        })
      : null);

  if (!asset) continue;

  const data = {};
  if (typeCode && !asset.typeCode) data.typeCode = typeCode;
  if (acquireSeq && ( !asset.acquireSeq || isBroken(asset.acquireSeq))) {
    data.acquireSeq = acquireSeq;
  }
  if (!Object.keys(data).length) continue;
  await prisma.asset.update({ where: { id: asset.id }, data });
  assetUpdated += 1;
}

const withType = await prisma.asset.count({
  where: { assetClass: "LOW_VALUE", typeCode: { not: null } },
});
const nullType = await prisma.asset.count({
  where: { assetClass: "LOW_VALUE", typeCode: null },
});

console.log(
  JSON.stringify({ stagingUpdated, assetUpdated, withType, nullType }, null, 2),
);
await prisma.$disconnect();
