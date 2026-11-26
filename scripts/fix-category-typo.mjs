/**
 * Fix typo ครุัณฑ์ → ครุภัณฑ์ in category names
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const BAD = "ครุัณฑ์";
const GOOD = "ครุภัณฑ์";

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

function fix(s) {
  if (!s || !s.includes(BAD)) return null;
  return s.split(BAD).join(GOOD);
}

const assetHits = await prisma.asset.findMany({
  where: { categoryName: { contains: BAD } },
  select: { id: true, categoryName: true },
});

const stagingHits = await prisma.importStagingRow.findMany({
  where: { categoryName: { contains: BAD } },
  select: { id: true, categoryName: true },
});

const categories = await prisma.assetCategory.findMany({
  where: {
    OR: [{ name: { contains: BAD } }, { code: { contains: BAD } }],
  },
  select: { id: true, name: true, code: true },
});

console.log(
  JSON.stringify(
    {
      assets: assetHits.length,
      sample: [...new Set(assetHits.map((a) => a.categoryName))],
      staging: stagingHits.length,
      categories: categories.map((c) => ({ name: c.name, code: c.code })),
    },
    null,
    2,
  ),
);

let assetUpdated = 0;
for (const row of assetHits) {
  const next = fix(row.categoryName);
  if (!next || next === row.categoryName) continue;
  await prisma.asset.update({
    where: { id: row.id },
    data: { categoryName: next },
  });
  assetUpdated += 1;
}

let stagingUpdated = 0;
for (const row of stagingHits) {
  const next = fix(row.categoryName);
  if (!next || next === row.categoryName) continue;
  await prisma.importStagingRow.update({
    where: { id: row.id },
    data: { categoryName: next },
  });
  stagingUpdated += 1;
}

let categoryUpdated = 0;
for (const row of categories) {
  const name = fix(row.name);
  const code = row.code ? fix(row.code) : null;
  const data = {};
  if (name && name !== row.name) data.name = name;
  if (code && code !== row.code) data.code = code;
  if (!Object.keys(data).length) continue;
  await prisma.assetCategory.update({ where: { id: row.id }, data });
  categoryUpdated += 1;
}

const remaining = await prisma.asset.count({
  where: { categoryName: { contains: BAD } },
});

console.log(
  JSON.stringify(
    { assetUpdated, stagingUpdated, categoryUpdated, remaining },
    null,
    2,
  ),
);
await prisma.$disconnect();
