import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs";

const url = process.env.DATABASE_URL;
const parsed = new URL(url);
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
  }),
});

const b = await prisma.importBatch.findFirst({
  where: { assetClass: "LOW_VALUE" },
  orderBy: { createdAt: "desc" },
});
const errs = await prisma.importStagingRow.findMany({
  where: { batchId: b.id, status: "ERROR" },
  take: 5,
  select: {
    rowNo: true,
    assetCode: true,
    itemName: true,
    validationErrors: true,
  },
});

fs.writeFileSync(
  "scripts/import-error-encoding.json",
  JSON.stringify({ batchId: b.id, errs }, null, 2),
  "utf8",
);
console.log("wrote scripts/import-error-encoding.json");
await prisma.$disconnect();
