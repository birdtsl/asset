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

const rows = await prisma.landParcel.findMany({
  orderBy: { parcelNo: "asc" },
});

fs.writeFileSync(
  "scripts/land-encoding.json",
  JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? Number(v) : v), 2),
  "utf8",
);
console.log("count", rows.length);
await prisma.$disconnect();
