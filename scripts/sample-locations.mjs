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

const samples = await prisma.asset.findMany({
  where: { assetClass: "NORMAL", isActive: true },
  take: 30,
  select: {
    assetCode: true,
    itemName: true,
    locationText: true,
    locationId: true,
  },
  orderBy: { assetCode: "asc" },
});

const distinct = await prisma.asset.groupBy({
  by: ["locationText"],
  where: { assetClass: "NORMAL", isActive: true },
  _count: { _all: true },
  orderBy: { _count: { locationText: "desc" } },
  take: 40,
});

const locs = await prisma.location.findMany({ take: 50 });

fs.writeFileSync(
  "scripts/location-sample.json",
  JSON.stringify({ samples, distinct, locs }, null, 2),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      sampleLocs: samples.slice(0, 10).map((s) => s.locationText),
      topDistinct: distinct.slice(0, 15),
      masterLocs: locs,
    },
    null,
    2,
  ),
);
await prisma.$disconnect();
