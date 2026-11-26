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
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
  }),
});

const batch = await prisma.importBatch.findFirst({
  where: { assetClass: "LOW_VALUE" },
  orderBy: { createdAt: "desc" },
});

const rows = await prisma.importStagingRow.findMany({
  where: { batchId: batch.id },
  take: 8,
  orderBy: { rowNo: "asc" },
  select: {
    rowNo: true,
    assetCode: true,
    typeCode: true,
    acquireSeq: true,
    itemName: true,
    rawJson: true,
  },
});

const samples = rows.map((r) => {
  const raw = JSON.parse(r.rawJson || "{}");
  const typeKeys = Object.keys(raw).filter((k) =>
    /กำหนดรหัส|รหัสครุภัณฑ์|ลำดับที่ได้มา|รหัสอาคาร/i.test(k),
  );
  return {
    rowNo: r.rowNo,
    stored: {
      assetCode: r.assetCode,
      typeCode: r.typeCode,
      acquireSeq: r.acquireSeq,
    },
    fromRaw: Object.fromEntries(typeKeys.map((k) => [k, raw[k]])),
  };
});

const nullType = await prisma.asset.count({
  where: { assetClass: "LOW_VALUE", typeCode: null },
});
const withType = await prisma.asset.count({
  where: { assetClass: "LOW_VALUE", typeCode: { not: null } },
});

fs.writeFileSync(
  "scripts/low-value-typecode.json",
  JSON.stringify({ batch: batch.fileName, nullType, withType, samples }, null, 2),
  "utf8",
);
console.log(JSON.stringify({ batch: batch.fileName, nullType, withType, samples }, null, 2));
await prisma.$disconnect();
