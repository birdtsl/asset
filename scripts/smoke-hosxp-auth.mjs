import "dotenv/config";
import mysql from "mysql2/promise";
import { createHash } from "crypto";

const url = process.env.HOSXP_DATABASE_URL;
if (!url) {
  console.error(JSON.stringify({ ok: false, error: "HOSXP_DATABASE_URL missing" }));
  process.exit(1);
}

const conn = await mysql.createConnection(url);
const [cols] = await conn.query(
  "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'opduser' ORDER BY ORDINAL_POSITION",
);
const colNames = cols.map((c) => c.COLUMN_NAME);
const [countRows] = await conn.query("SELECT COUNT(*) AS c FROM opduser");

const userAllow = [
  "usercode",
  "userid",
  "username",
  "user",
  "loginname",
  "login",
  "staffcode",
  "empcode",
];
const passAllow = ["passweb", "pass", "password", "passord", "passweb1", "passweb2"];
const userCol = userAllow.find((c) => colNames.includes(c)) || colNames[0];
const passCols = passAllow.filter((c) => colNames.includes(c));
const hasName = colNames.includes("name");

const selectCols = [
  `\`${userCol}\` AS u`,
  hasName ? "`name` AS n" : null,
  ...passCols.slice(0, 2).map((c, i) => `\`${c}\` AS p${i}`),
]
  .filter(Boolean)
  .join(", ");

const [sample] = await conn.query(
  `SELECT ${selectCols} FROM opduser WHERE \`${userCol}\` IS NOT NULL AND \`${userCol}\` <> '' LIMIT 3`,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      db: new URL(url.replace(/^mysql:/, "http:")).pathname.replace(/^\//, ""),
      authEnabled: process.env.HOSXP_AUTH_ENABLED,
      defaultRole: process.env.HOSXP_DEFAULT_ROLE,
      detectedUserCol: userCol,
      detectedPassCols: passCols,
      opduserColumns: colNames,
      opduserCount: Number(countRows[0].c),
      sampleUsers: sample.map((r) => ({
        user: r.u,
        name: r.n ?? null,
        hasPass: Boolean(r.p0 || r.p1),
      })),
      md5SelfCheck: createHash("md5").update("test", "utf8").digest("hex"),
    },
    null,
    2,
  ),
);
await conn.end();
