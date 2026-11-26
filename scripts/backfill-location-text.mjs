/**
 * Fix locationText wrongly mapped from Excel column "ที่" (row seq)
 * back to real "สถานที่ตั้ง/ผู้รับผิดชอบ" from staging raw_json.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs";

function isBroken(s) {
  if (!s) return false;
  if (/[\u0080-\u009F]/.test(s)) return true;
  const triples = (s.match(/เธ./g) || []).length;
  const thai = (s.match(/[\u0E00-\u0E7F]/g) || []).length;
  return thai >= 4 && triples >= 1 && triples * 2 >= thai * 0.4;
}
function encode(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfffd) {
      out.push(0xa0);
      continue;
    }
    if (cp <= 0x9f) {
      out.push(cp);
      continue;
    }
    if (cp >= 0x0e01 && cp <= 0x0e5b) {
      out.push(cp - 0x0e00 + 0xa0);
      continue;
    }
    for (const b of Buffer.from(ch, "utf8")) out.push(b);
  }
  return Buffer.from(out);
}
function fixThai(s) {
  if (!s || !isBroken(s)) return s;
  const f = encode(s).toString("utf8");
  if (!f || f.includes("\uFFFD") || isBroken(f)) return s;
  return f;
}

function extractLocation(raw) {
  if (!raw || typeof raw !== "object") return null;
  const keys = Object.keys(raw);
  const preferred = keys.find((k) =>
    normalize(k).includes("สถานที่ตั้ง/ผู้รับผิดชอบ"),
  );
  if (preferred) {
    const v = String(raw[preferred] ?? "").trim();
    return v && v !== "-" ? fixThai(v) : null;
  }
  return null;
}

function normalize(h) {
  return String(h).replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
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
    collation: "utf8mb4_unicode_ci",
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
  }),
});

const staging = await prisma.importStagingRow.findMany({
  select: {
    id: true,
    batchId: true,
    rowNo: true,
    assetCode: true,
    locationText: true,
    rawJson: true,
    matchedAssetId: true,
  },
});

let stagingUpdated = 0;
let assetUpdated = 0;
const samples = [];

for (const row of staging) {
  let raw = {};
  try {
    raw = JSON.parse(row.rawJson || "{}");
  } catch {
    continue;
  }
  const loc = extractLocation(raw);
  if (!loc) continue;

  if (row.locationText !== loc) {
    await prisma.importStagingRow.update({
      where: { id: row.id },
      data: { locationText: loc },
    });
    stagingUpdated += 1;
  }

  // Update linked asset by matchedAssetId or source batch/row
  let assetId = row.matchedAssetId;
  if (!assetId) {
    const bySource = await prisma.asset.findFirst({
      where: { sourceBatchId: row.batchId, sourceRowNo: row.rowNo },
      select: { id: true, locationText: true },
    });
    if (bySource) assetId = bySource.id;
  }
  if (!assetId && row.assetCode) {
    const byCode = await prisma.asset.findFirst({
      where: { assetCode: row.assetCode },
      select: { id: true, locationText: true },
    });
    // only overwrite if current looks like a numeric code
    if (byCode && (!byCode.locationText || /^\d+$/.test(byCode.locationText))) {
      assetId = byCode.id;
    } else {
      assetId = null;
    }
  }

  if (assetId) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { locationText: true },
    });
    if (asset && asset.locationText !== loc) {
      await prisma.asset.update({
        where: { id: assetId },
        data: { locationText: loc },
      });
      assetUpdated += 1;
      if (samples.length < 8) {
        samples.push({
          assetCode: row.assetCode,
          from: asset.locationText,
          to: loc,
        });
      }
    }
  }
}

const afterNumeric = await prisma.asset.count({
  where: { locationText: { not: null }, AND: [{ locationText: { equals: undefined } }] },
});
const stillNumeric = await prisma.$queryRaw`
  SELECT COUNT(*) AS c FROM assets
  WHERE location_text REGEXP '^[0-9]+$'
`;

fs.writeFileSync(
  "scripts/location-backfill-report.json",
  JSON.stringify(
    {
      stagingUpdated,
      assetUpdated,
      samples,
      stillNumeric: Number(stillNumeric[0]?.c ?? 0),
    },
    null,
    2,
  ),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      stagingUpdated,
      assetUpdated,
      samples,
      stillNumeric: Number(stillNumeric[0]?.c ?? 0),
    },
    null,
    2,
  ),
);
await prisma.$disconnect();
