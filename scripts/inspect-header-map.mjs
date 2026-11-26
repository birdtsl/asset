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
  where: { assetClass: "NORMAL" },
  orderBy: { createdAt: "desc" },
});
const row = await prisma.importStagingRow.findFirst({
  where: { batchId: batch.id },
  orderBy: { rowNo: "asc" },
});
const raw = JSON.parse(row.rawJson);
const keys = Object.keys(raw);

// show index of location-related and "ที่"
const interesting = keys
  .map((k, i) => ({ i, k, v: raw[k] }))
  .filter(
    (x) =>
      x.k.includes("สถานที่") ||
      x.k === "ที่" ||
      x.k.includes("รหัสอาคาร") ||
      x.k.includes("ชนิด"),
  );

// count how many locationText look numeric vs text in assets
const all = await prisma.asset.findMany({
  where: { assetClass: "NORMAL", isActive: true },
  select: { locationText: true },
});
const numeric = all.filter((a) => a.locationText && /^\d+$/.test(a.locationText)).length;
const textual = all.filter((a) => a.locationText && !/^\d+$/.test(a.locationText)).length;

// recover from staging raw for a few
const staging = await prisma.importStagingRow.findMany({
  where: { batchId: batch.id, status: "COMMITTED" },
  take: 20,
  orderBy: { rowNo: "asc" },
});
const recovered = staging.map((s) => {
  const r = JSON.parse(s.rawJson || "{}");
  return {
    rowNo: s.rowNo,
    stored: s.locationText,
    fromRaw: r["สถานที่ตั้ง/ผู้รับผิดชอบ"] || r["สถานที่ตั้ง / ผู้รับผิดชอบ"] || null,
  };
});

fs.writeFileSync(
  "scripts/location-header-debug.json",
  JSON.stringify({ interesting, numeric, textual, recovered }, null, 2),
  "utf8",
);
console.log(JSON.stringify({ interesting, numeric, textual, recovered: recovered.slice(0, 8) }, null, 2));
await prisma.$disconnect();
