import "dotenv/config";
import mariadb from "mariadb";
import fs from "fs";

function encodeWin874Loose(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp <= 0x9f) out.push(cp);
    else if (cp >= 0x0e01 && cp <= 0x0e5b) out.push(cp - 0x0e00 + 0xa0);
    else {
      const utf8 = Buffer.from(ch, "utf8");
      for (const b of utf8) out.push(b);
    }
  }
  return Buffer.from(out);
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

const cats = await conn.query(`SELECT id, name, description FROM asset_categories`);
const campaigns = await conn.query(`SELECT id, title, notes FROM inspection_campaigns`);
const batches = await conn.query(`SELECT id, file_name FROM import_batches`);

function analyze(s) {
  const buf = encodeWin874Loose(s);
  const fixed = buf.toString("utf8");
  return {
    before: s,
    beforeCps: [...s].slice(0, 30).map((c) => c.codePointAt(0).toString(16)),
    bufHex: buf.subarray(0, 40).toString("hex"),
    after: fixed,
    hasFFFD: fixed.includes("\uFFFD"),
  };
}

const report = {
  cats: cats.map((c) => analyze(c.name)),
  campaigns: campaigns.map((c) => analyze(c.title)),
  batches: batches.map((b) => analyze(b.file_name)),
};

fs.writeFileSync("scripts/debug-category.json", JSON.stringify(report, null, 2), "utf8");
console.log("ok");
await conn.end();
