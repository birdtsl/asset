import "dotenv/config";
import {
  createIssueDraft,
  createReceiptDraft,
  postIssue,
  postReceipt,
} from "../src/lib/inventory/stock-service";
import { prisma } from "../src/lib/prisma";

async function main() {
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!admin) throw new Error("admin not found");

  const warehouse = await prisma.warehouse.findUnique({ where: { code: "MAIN" } });
  if (!warehouse) throw new Error("MAIN warehouse not found");

  const materials = await prisma.material.findMany({
    where: { code: { in: ["PAPER-A4", "GLOVE-M", "MASK-SUR"] } },
  });
  if (materials.length < 3) throw new Error("materials not seeded");

  const today = new Date().toISOString().slice(0, 10);
  const byCode = Object.fromEntries(materials.map((m) => [m.code, m]));

  console.log("Creating receipt...");
  const receipt = await createReceiptDraft(
    {
      warehouseId: warehouse.id,
      receiptDate: today,
      refNo: "DEMO-RC-001",
      notes: "ตัวอย่างรับเข้า Phase 3",
      items: [
        { materialId: byCode["PAPER-A4"].id, quantity: 50, unitCost: 120 },
        { materialId: byCode["GLOVE-M"].id, quantity: 100, unitCost: 85 },
        { materialId: byCode["MASK-SUR"].id, quantity: 80, unitCost: 65 },
      ],
    },
    admin.id,
  );
  await postReceipt(receipt.id, admin.id);
  console.log("Posted receipt", receipt.docNo);

  console.log("Creating issue...");
  const issue = await createIssueDraft(
    {
      warehouseId: warehouse.id,
      issueDate: today,
      requestedBy: "งานพัสดุ",
      purpose: "เบิกใช้งานประจำ",
      items: [
        { materialId: byCode["PAPER-A4"].id, quantity: 5 },
        { materialId: byCode["GLOVE-M"].id, quantity: 10 },
      ],
    },
    admin.id,
  );
  await postIssue(issue.id, admin.id);
  console.log("Posted issue", issue.docNo);

  const balances = await prisma.stockBalance.findMany({
    include: { material: true },
  });
  console.log(
    "Balances:",
    balances.map((b) => ({
      code: b.material.code,
      qty: Number(b.quantity),
      avg: Number(b.avgCost),
    })),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
