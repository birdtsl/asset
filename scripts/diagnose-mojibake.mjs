import "dotenv/config";
import mariadb from "mariadb";
import fs from "fs";

const url = new URL(process.env.DATABASE_URL);
const conn = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  charset: "utf8mb4",
});

const rows = await conn.query(
  `SELECT id, asset_code, item_name FROM assets LIMIT 3`,
);

function tryLatin1ToUtf8(s) {
  return Buffer.from(s, "latin1").toString("utf8");
}

function tryUtf8AsWin874(s) {
  // unlikely
  return s;
}

function looksMojibake(s) {
  if (!s) return false;
  // Classic Thai UTF-8 misread as latin1: lots of เธ / เน sequences
  return /เธ[\u0080-\u00ff]|เน[\u0080-\u00ff]/.test(s) || /เธ.|เน./.test(s) && s.includes("เธ");
}

const out = rows.map((r) => {
  const fixedCode = tryLatin1ToUtf8(r.asset_code);
  const fixedName = tryLatin1ToUtf8(r.item_name);
  return {
    rawCode: r.asset_code,
    rawName: r.item_name,
    fixedCode,
    fixedName,
    rawHex: Buffer.from(r.item_name, "utf8").subarray(0, 24).toString("hex"),
    codePoints: [...r.item_name].slice(0, 8).map((c) => c.codePointAt(0).toString(16)),
  };
});

fs.writeFileSync(
  "scripts/mojibake-sample.json",
  JSON.stringify(out, null, 2),
  "utf8",
);
console.log("wrote scripts/mojibake-sample.json");
await conn.end();
