import "dotenv/config";
import mariadb from "mariadb";
import iconv from "iconv-lite";
import fs from "fs";

function fixThaiMojibake(s) {
  if (s == null || s === "") return s;
  // UTF-8 bytes were decoded as win874/TIS-620 then stored as UTF-8
  const asWin874 = iconv.encode(s, "win874");
  const fixed = iconv.decode(asWin874, "utf8");
  // Only accept if result looks like proper Thai/ASCII and differs
  if (fixed !== s && !fixed.includes("\uFFFD")) {
    return fixed;
  }
  // try tis620
  const asTis = iconv.encode(s, "tis620");
  const fixed2 = iconv.decode(asTis, "utf8");
  if (fixed2 !== s && !fixed2.includes("\uFFFD")) {
    return fixed2;
  }
  return s;
}

function looksBroken(s) {
  if (!s) return false;
  // pattern: Thai letters mixed with C1 controls (U+0080-U+009F) from win874 undefined bytes
  if (/[\u0080-\u009F]/.test(s)) return true;
  // classic เธ / เน prefixes for what should be single Thai chars
  if (/เธ[ก-ฮ\u0080-\u009F]|เน[\u0080-\u009F]/.test(s)) return true;
  return false;
}

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
  `SELECT asset_code, item_name, location_text, category_name FROM assets LIMIT 8`,
);
const depts = await conn.query(`SELECT code, name FROM departments`);
const users = await conn.query(`SELECT username, full_name FROM users`);

const result = {
  assets: rows.map((r) => ({
    code: r.asset_code,
    fixedCode: fixThaiMojibake(r.asset_code),
    name: r.item_name,
    fixedName: fixThaiMojibake(r.item_name),
    loc: r.location_text,
    fixedLoc: fixThaiMojibake(r.location_text),
    broken: looksBroken(r.item_name),
  })),
  departments: depts.map((d) => ({
    ...d,
    fixed: fixThaiMojibake(d.name),
  })),
  users: users.map((u) => ({
    ...u,
    fixed: fixThaiMojibake(u.full_name),
  })),
};

fs.writeFileSync("scripts/mojibake-fixed-sample.json", JSON.stringify(result, null, 2), "utf8");
console.log("wrote scripts/mojibake-fixed-sample.json");
await conn.end();
