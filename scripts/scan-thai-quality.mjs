import "dotenv/config";
import mariadb from "mariadb";
import fs from "fs";

function looksBroken(s) {
  if (!s) return false;
  if (/[\u0080-\u009F]/.test(s)) return true;
  // many เธX triples typical of utf8-as-tis620
  const triples = (s.match(/เธ./g) || []).length;
  const thaiChars = (s.match(/[\u0E00-\u0E7F]/g) || []).length;
  if (thaiChars >= 6 && triples >= 2 && triples * 2 >= thaiChars * 0.5) return true;
  return false;
}

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

function fixThaiMojibake(s) {
  if (s == null || s === "") return s;
  if (!looksBroken(s)) return s;
  const fixed = encodeWin874Loose(s).toString("utf8");
  if (!fixed || fixed.includes("\uFFFD")) return s;
  return fixed;
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

const targets = [
  { table: "assets", cols: ["asset_code", "item_name", "category_name", "location_text", "brand_model", "budget_type", "acquire_method", "document_ref", "vendor_name", "vendor_address", "notes", "type_code"] },
  { table: "departments", cols: ["name", "description"] },
  { table: "locations", cols: ["name", "description"] },
  { table: "asset_categories", cols: ["name", "description"] },
  { table: "units", cols: ["name"] },
  { table: "budget_sources", cols: ["name"] },
  { table: "suppliers", cols: ["name", "address"] },
  { table: "asset_statuses", cols: ["name"] },
  { table: "users", cols: ["full_name"] },
  { table: "roles", cols: ["name", "description"] },
  { table: "permissions", cols: ["name"] },
  { table: "system_settings", cols: ["value", "label"] },
  { table: "materials", cols: ["name", "description"] },
  { table: "material_categories", cols: ["name"] },
  { table: "warehouses", cols: ["name"] },
  { table: "land_parcels", cols: ["title", "address", "responsible_unit", "donor_name", "notes", "area_text"] },
  { table: "import_batches", cols: ["file_name"] },
  { table: "import_staging_rows", cols: ["item_name", "asset_code", "category_name", "location_text", "brand_model", "error_message"] },
  { table: "notifications", cols: ["title", "message"] },
  { table: "inspection_campaigns", cols: ["title", "notes"] },
  { table: "audit_logs", cols: ["detail"] },
];

const summary = [];
for (const t of targets) {
  // verify table exists
  const exists = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA='tsl_asset' AND TABLE_NAME=?`,
    [t.table],
  );
  if (Number(exists[0].c) === 0) continue;

  // verify columns
  const realCols = [];
  for (const c of t.cols) {
    const col = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tsl_asset' AND TABLE_NAME=? AND COLUMN_NAME=?`,
      [t.table, c],
    );
    if (Number(col[0].c) > 0) realCols.push(c);
  }
  if (realCols.length === 0) continue;

  const rows = await conn.query(`SELECT ${realCols.map((c) => `\`${c}\``).join(",")} FROM \`${t.table}\``);
  let broken = 0;
  let samples = [];
  for (const row of rows) {
    for (const c of realCols) {
      const v = row[c];
      if (typeof v === "string" && looksBroken(v)) {
        broken++;
        if (samples.length < 2) {
          samples.push({ col: c, before: v, after: fixThaiMojibake(v) });
        }
      }
    }
  }
  summary.push({ table: t.table, rows: rows.length, brokenCells: broken, samples });
}

fs.writeFileSync("scripts/thai-quality-scan.json", JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify(summary.map((s) => ({ table: s.table, brokenCells: s.brokenCells, sampleAfter: s.samples[0]?.after })), null, 2));
await conn.end();
