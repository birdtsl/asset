import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const parsed = new URL(url);
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function main() {
  // inline refresh of one alert
  const pending = await prisma.inspectionItem.count({
    where: { result: "PENDING", campaign: { status: "IN_PROGRESS" } },
  });
  if (pending > 0) {
    await prisma.notification.upsert({
      where: { dedupeKey: "INSPECTION:PENDING" },
      create: {
        title: "รายการค้างตรวจประจำปี",
        message: `มี ${pending} รายการที่ยังไม่บันทึกผลตรวจ`,
        severity: "WARNING",
        category: "INSPECTION",
        href: "/inspection",
        dedupeKey: "INSPECTION:PENDING",
      },
      update: {
        message: `มี ${pending} รายการที่ยังไม่บันทึกผลตรวจ`,
      },
    });
  }

  const [noti, assets, materials] = await Promise.all([
    prisma.notification.count(),
    prisma.asset.count({ where: { isActive: true } }),
    prisma.material.count({ where: { isActive: true } }),
  ]);

  console.log(
    JSON.stringify({
      ok: true,
      notifications: noti,
      assets,
      materials,
      pendingInspection: pending,
    }),
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
