import iconv from "iconv-lite";
import fs from "fs";
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

const [row] = await conn.query(
  `SELECT asset_code, item_name FROM assets LIMIT 1`,
);

const s = row.asset_code;
const sample = s.slice(s.indexOf(" ")); // Thai part

const cps = [...sample].map((c) => ({
  ch: c,
  cp: c.codePointAt(0),
  hex: c.codePointAt(0).toString(16),
}));

// Manual TIS-620 / win874 encode for Thai + C1 controls
function encodeWin874Loose(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80) {
      out.push(cp);
    } else if (cp >= 0x80 && cp <= 0x9f) {
      // C1 controls that came from undefined win874 bytes
      out.push(cp);
    } else if (cp >= 0x0e00 && cp <= 0x0e7f) {
      // Thai block → win874/tis620 is 0xa1+ for most; เ is 0xe0
      // Standard: U+0E01 (ก) = 0xA1 ... 
      out.push(cp - 0x0e00 + 0xa0);
    } else {
      // try iconv for this char
      const b = iconv.encode(ch, "win874");
      for (const x of b) out.push(x);
    }
  }
  return Buffer.from(out);
}

const buf = encodeWin874Loose(sample);
let fixed = "";
try {
  fixed = buf.toString("utf8");
} catch (e) {
  fixed = String(e);
}

// Also try: take UTF-8 bytes of the string, interpret differently
const utf8bytes = Buffer.from(sample, "utf8");

const report = {
  sample,
  cps: cps.slice(0, 20),
  manualBufHex: buf.toString("hex"),
  manualFixed: fixed,
  iconvWin874Hex: iconv.encode(sample, "win874").toString("hex"),
  iconvWin874AsUtf8: iconv.decode(iconv.encode(sample, "win874"), "utf8"),
  iconvTisHex: iconv.encode(sample, "tis620").toString("hex"),
  iconvTisAsUtf8: iconv.decode(iconv.encode(sample, "tis620"), "utf8"),
};

fs.writeFileSync("scripts/debug-iconv.json", JSON.stringify(report, null, 2), "utf8");
console.log("wrote scripts/debug-iconv.json");
await conn.end();
