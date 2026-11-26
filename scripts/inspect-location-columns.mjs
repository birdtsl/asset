import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs";

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

const batch = await prisma.importBatch.findFirst({
  where: { assetClass: "NORMAL" },
  orderBy: { createdAt: "desc" },
});

const rows = await prisma.importStagingRow.findMany({
  where: { batchId: batch.id },
  take: 5,
  orderBy: { rowNo: "asc" },
  select: {
    rowNo: true,
    assetCode: true,
    itemName: true,
    locationText: true,
    rawJson: true,
  },
});

const parsed = rows.map((r) => {
  let raw = {};
  try {
    raw = JSON.parse(r.rawJson || "{}");
  } catch {
    raw = { parseError: true };
  }
  return {
    rowNo: r.rowNo,
    assetCode: r.assetCode,
    itemName: r.itemName,
    locationText: r.locationText,
    rawKeys: Object.keys(raw),
    raw,
  };
});

// find keys that look like location
const keyHits = new Set();
for (const p of parsed) {
  for (const k of p.rawKeys) {
    if (/สถานที่|ผู้รับผิดชอบ|หน่วยงาน|อาคาร|ห้อง|location|place|dept/i.test(k)) {
      keyHits.add(k);
    }
  }
}

fs.writeFileSync(
  "scripts/location-columns.json",
  JSON.stringify(
    {
      batchId: batch.id,
      file: batch.fileName,
      locationLikeKeys: [...keyHits],
      samples: parsed,
    },
    null,
    2,
  ),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      file: batch.fileName,
      locationLikeKeys: [...keyHits],
      firstRawKeys: parsed[0]?.rawKeys?.slice(0, 40),
      firstLocationText: parsed[0]?.locationText,
      firstRawLocationFields: Object.fromEntries(
        Object.entries(parsed[0]?.raw || {}).filter(([k]) =>
          /สถานที่|ผู้รับผิดชอบ|หน่วยงาน|อาคาร|ห้อง/i.test(k),
        ),
      ),
    },
    null,
    2,
  ),
);
await prisma.$disconnect();
