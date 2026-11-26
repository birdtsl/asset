import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const parsed = new URL(url);
  return new PrismaClient({
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
}

const prisma = createClient();

async function main() {
  console.log("Seeding inventory master data...");

  const warehouse = await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: { name: "คลังพัสดุกลาง", locationText: "อาคารพัสดุ" },
    create: {
      code: "MAIN",
      name: "คลังพัสดุกลาง",
      locationText: "อาคารพัสดุ",
    },
  });

  const categories = [
    { code: "OFFICE-MAT", name: "วัสดุสำนักงาน" },
    { code: "MED-MAT", name: "วัสดุการแพทย์" },
    { code: "CLEAN-MAT", name: "วัสดุทำความสะอาด" },
    { code: "IT-MAT", name: "วัสดุคอมพิวเตอร์" },
  ];

  for (const c of categories) {
    await prisma.materialCategory.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: c,
    });
  }

  const unitPcs = await prisma.unit.upsert({
    where: { code: "PCS" },
    update: { name: "ชิ้น" },
    create: { code: "PCS", name: "ชิ้น" },
  });
  const unitBox = await prisma.unit.upsert({
    where: { code: "BOX" },
    update: { name: "กล่อง" },
    create: { code: "BOX", name: "กล่อง" },
  });
  const unitReam = await prisma.unit.upsert({
    where: { code: "REAM" },
    update: { name: "รีม" },
    create: { code: "REAM", name: "รีม" },
  });

  const catMap = Object.fromEntries(
    (
      await prisma.materialCategory.findMany({
        where: { code: { in: categories.map((c) => c.code) } },
      })
    ).map((c) => [c.code, c.id]),
  );

  const materials = [
    {
      code: "PAPER-A4",
      name: "กระดาษ A4 80 แกรม",
      categoryId: catMap["OFFICE-MAT"],
      unitId: unitReam.id,
      minStock: 10,
      reorderPoint: 20,
    },
    {
      code: "PEN-BLUE",
      name: "ปากกาลูกลื่น สีน้ำเงิน",
      categoryId: catMap["OFFICE-MAT"],
      unitId: unitBox.id,
      minStock: 5,
      reorderPoint: 10,
    },
    {
      code: "GLOVE-M",
      name: "ถุงมือยาง ขนาด M",
      categoryId: catMap["MED-MAT"],
      unitId: unitBox.id,
      minStock: 20,
      reorderPoint: 40,
    },
    {
      code: "MASK-SUR",
      name: "หน้ากากอนามัยทางการแพทย์",
      categoryId: catMap["MED-MAT"],
      unitId: unitBox.id,
      minStock: 30,
      reorderPoint: 50,
    },
    {
      code: "DETERGENT",
      name: "น้ำยาทำความสะอาดพื้น",
      categoryId: catMap["CLEAN-MAT"],
      unitId: unitPcs.id,
      minStock: 8,
      reorderPoint: 12,
    },
    {
      code: "TONER-BK",
      name: "ตลับหมึกเครื่องพิมพ์ สีดำ",
      categoryId: catMap["IT-MAT"],
      unitId: unitPcs.id,
      minStock: 2,
      reorderPoint: 4,
    },
  ];

  for (const m of materials) {
    await prisma.material.upsert({
      where: { code: m.code },
      update: {
        name: m.name,
        categoryId: m.categoryId,
        unitId: m.unitId,
        minStock: m.minStock,
        reorderPoint: m.reorderPoint,
      },
      create: {
        code: m.code,
        name: m.name,
        categoryId: m.categoryId,
        unitId: m.unitId,
        minStock: m.minStock,
        reorderPoint: m.reorderPoint,
      },
    });
  }

  console.log("Warehouse:", warehouse.code, warehouse.name);
  console.log("Materials seeded:", materials.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
