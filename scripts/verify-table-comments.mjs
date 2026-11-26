import "dotenv/config";
import mariadb from "mariadb";
import fs from "fs";

const u = new URL(process.env.DATABASE_URL);
const conn = await mariadb.createConnection({
  host: u.hostname,
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ""),
  charset: "utf8mb4",
});

const rows = await conn.query(`
  SELECT TABLE_NAME AS t, TABLE_COMMENT AS c
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'tsl_asset' AND TABLE_TYPE = 'BASE TABLE'
  ORDER BY TABLE_NAME
`);

fs.writeFileSync(
  "scripts/table-comments.json",
  JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? Number(v) : v), 2),
  "utf8",
);
console.log(
  JSON.stringify(
    {
      tables: rows.length,
      withComment: rows.filter((r) => r.c && String(r.c).trim()).length,
      sample: rows.slice(0, 8),
    },
    null,
    2,
  ),
);
await conn.end();
