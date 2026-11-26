import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(url);
  const [dbInfo] = await conn.query(
    `SELECT DEFAULT_CHARACTER_SET_NAME AS charset, DEFAULT_COLLATION_NAME AS collation
     FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'tsl_asset'`,
  );
  console.log("DB_CHARSET=", JSON.stringify(dbInfo));

  const [tables] = await conn.query(
    `SELECT TABLE_NAME, TABLE_COLLATION
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = 'tsl_asset'`,
  );
  console.log("TABLES=", JSON.stringify(tables));

  // Safe: alter only tsl_asset charset — does not drop data
  await conn.query(
    `ALTER DATABASE tsl_asset CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log("ALTER_DATABASE_OK");

  for (const t of tables) {
    const name = t.TABLE_NAME;
    await conn.query(
      `ALTER TABLE \`${name}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log("ALTER_TABLE_OK=" + name);
  }

  await conn.end();

  // Quick prisma sanity
  const prisma = new PrismaClient();
  await prisma.$queryRaw`SELECT 1 AS ok`;
  await prisma.$disconnect();
  console.log("PRISMA_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
