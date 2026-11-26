import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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
  }),
});

const b = await prisma.importBatch.findFirst({
  where: { assetClass: "LOW_VALUE" },
  orderBy: { createdAt: "desc" },
});
if (!b) {
  console.log("no batch");
  process.exit(0);
}

const byStatus = await prisma.importStagingRow.groupBy({
  by: ["status"],
  where: { batchId: b.id },
  _count: { _all: true },
});
const byAction = await prisma.importStagingRow.groupBy({
  by: ["commitAction"],
  where: { batchId: b.id },
  _count: { _all: true },
});
const errs = await prisma.importStagingRow.findMany({
  where: { batchId: b.id, status: "ERROR" },
  take: 30,
  orderBy: { rowNo: "asc" },
  select: {
    rowNo: true,
    assetCode: true,
    itemName: true,
    validationErrors: true,
    validationWarnings: true,
    commitAction: true,
  },
});

const reasonCount = {};
for (const e of errs) {
  const list = e.validationErrors ? JSON.parse(e.validationErrors) : [];
  for (const r of list) reasonCount[r] = (reasonCount[r] || 0) + 1;
}

console.log(
  JSON.stringify(
    {
      id: b.id,
      file: b.fileName,
      totals: {
        total: b.totalRows,
        valid: b.validRows,
        warn: b.warningRows,
        err: b.errorRows,
        committed: b.committedRows,
      },
      byStatus,
      byAction,
      reasonCount,
      errs: errs.slice(0, 10),
    },
    null,
    2,
  ),
);
await prisma.$disconnect();
