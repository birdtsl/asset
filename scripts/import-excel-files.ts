import "dotenv/config";
import fs from "fs";
import {
  commitImportBatch,
  createImportBatch,
  validateImportBatch,
} from "../src/lib/imports/service";
import { prisma } from "../src/lib/prisma";

async function main() {
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!admin) throw new Error("admin user not found — run db:seed first");

  const jobs = [
    {
      assetClass: "NORMAL" as const,
      file: String.raw`E:\ทะเบียนครุภัณฑ์\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่.xlsm`,
    },
    {
      assetClass: "LOW_VALUE" as const,
      file: String.raw`E:\ทะเบียนครุภัณฑ์\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่า\ทะเบียนคุมทรัพย์สิน-ครุภัณฑ์-ใหม่ ต่ำกว่าเกณฑ์.xlsm`,
    },
  ];

  for (const job of jobs) {
    console.log("\n==>", job.assetClass, job.file);
    const buffer = fs.readFileSync(job.file);
    const batch = await createImportBatch({
      fileName: job.file.split("\\").pop() || "import.xlsm",
      buffer,
      assetClass: job.assetClass,
      userId: admin.id,
    });
    console.log("uploaded", batch.id, "rows", batch.totalRows);

    const validated = await validateImportBatch(batch.id, admin.id);
    console.log("validated", {
      status: validated.status,
      valid: validated.validRows,
      warning: validated.warningRows,
      error: validated.errorRows,
    });

    const committed = await commitImportBatch(batch.id, admin.id);
    console.log("committed", committed.committedRows);
  }

  const counts = await Promise.all([
    prisma.asset.count({ where: { assetClass: "NORMAL" } }),
    prisma.asset.count({ where: { assetClass: "LOW_VALUE" } }),
  ]);
  console.log("\nFINAL COUNTS", { NORMAL: counts[0], LOW_VALUE: counts[1] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
