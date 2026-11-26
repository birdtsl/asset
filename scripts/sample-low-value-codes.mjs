import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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

const rows = await prisma.asset.findMany({
  where: { assetClass: "LOW_VALUE", isActive: true },
  take: 12,
  orderBy: { assetCode: "asc" },
  select: {
    assetCode: true,
    typeCode: true,
    acquireSeq: true,
    itemName: true,
  },
});

console.log(JSON.stringify(rows, null, 2));
await prisma.$disconnect();
