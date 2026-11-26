import "dotenv/config";
import mariadb from "mariadb";

const url = new URL(process.env.DATABASE_URL);
const conn = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  charset: "utf8mb4",
});

const db = await conn.query(
  `SELECT DEFAULT_CHARACTER_SET_NAME AS charset, DEFAULT_COLLATION_NAME AS collation
   FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
  ["tsl_asset"],
);

const tables = await conn.query(
  `SELECT TABLE_NAME AS name, TABLE_COLLATION AS collation
   FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = 'tsl_asset'
   ORDER BY TABLE_NAME`,
);

const cols = await conn.query(
  `SELECT TABLE_NAME AS t, COLUMN_NAME AS c, CHARACTER_SET_NAME AS cs, COLLATION_NAME AS cl
   FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = 'tsl_asset'
     AND DATA_TYPE IN ('varchar','char','text','mediumtext','longtext','tinytext')
     AND (CHARACTER_SET_NAME IS NULL OR CHARACTER_SET_NAME <> 'utf8mb4'
          OR COLLATION_NAME NOT LIKE 'utf8mb4%')
   ORDER BY TABLE_NAME, COLUMN_NAME`,
);

const samples = await conn.query(`
  SELECT 'asset' AS src, asset_code AS code, item_name AS name FROM assets WHERE item_name IS NOT NULL LIMIT 5
`);
const depts = await conn.query(`SELECT code, name FROM departments LIMIT 5`);
const users = await conn.query(`SELECT username, full_name FROM users LIMIT 3`);
const session = await conn.query(`SHOW VARIABLES LIKE 'character_set%'`);

console.log(
  JSON.stringify(
    {
      database: db[0],
      tableCount: tables.length,
      nonUtf8mb4Tables: tables.filter((t) => !String(t.collation).startsWith("utf8mb4")),
      badColumns: cols,
      session,
      samples: { assets: samples, departments: depts, users },
    },
    (_, v) => (typeof v === "bigint" ? Number(v) : v),
    2,
  ),
);

await conn.end();
