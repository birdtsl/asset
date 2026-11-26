/**
 * One-time repair: fix Thai mojibake in tsl_asset text columns.
 * Safe: UPDATE only string values that look corrupted; no DROP/DELETE.
 */
import "dotenv/config";
import mariadb from "mariadb";
import fs from "fs";

function isBrokenThaiMojibake(s) {
  if (!s) return false;
  if (/[\u0080-\u009F]/.test(s)) return true;
  if (s.includes("\uFFFD") && /เ[ธน]/.test(s)) return true;
  const triples = (s.match(/เธ./g) || []).length;
  const thaiChars = (s.match(/[\u0E00-\u0E7F]/g) || []).length;
  if (thaiChars >= 6 && triples >= 2 && triples * 2 >= thaiChars * 0.5) return true;
  return false;
}

function encodeWin874Loose(str) {
  const out = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfffd) {
      const prev1 = out[out.length - 1];
      const prev2 = out[out.length - 2];
      if (prev2 === 0xe0 && (prev1 === 0xb8 || prev1 === 0xb9)) out.push(0xa0);
      else out.push(0xa0);
      continue;
    }
    if (cp <= 0x9f) {
      out.push(cp);
      continue;
    }
    if (cp >= 0x0e01 && cp <= 0x0e5b) {
      out.push(cp - 0x0e00 + 0xa0);
      continue;
    }
    const utf8 = Buffer.from(ch, "utf8");
    for (const b of utf8) out.push(b);
  }
  return Buffer.from(out);
}

function fixThaiMojibake(input) {
  if (input == null || input === "") return input;
  if (!isBrokenThaiMojibake(input)) return input;
  const fixed = encodeWin874Loose(input).toString("utf8");
  if (!fixed) return input;
  if (fixed.includes("\uFFFD")) {
    const cleaned = fixed.replace(/\uFFFD/g, "");
    if (cleaned && /[\u0E00-\u0E7F]/.test(cleaned) && !isBrokenThaiMojibake(cleaned)) {
      return cleaned;
    }
    return input;
  }
  if (isBrokenThaiMojibake(fixed)) return input;
  return fixed;
}

const TARGETS = [
  { table: "assets", pk: "id", cols: ["asset_code", "item_name", "category_name", "location_text", "brand_model", "budget_type", "acquire_method", "document_ref", "vendor_name", "vendor_address", "vendor_phone", "notes", "type_code"] },
  { table: "departments", pk: "id", cols: ["name", "description"] },
  { table: "locations", pk: "id", cols: ["name", "description"] },
  { table: "asset_categories", pk: "id", cols: ["name", "description"] },
  { table: "units", pk: "id", cols: ["name"] },
  { table: "budget_sources", pk: "id", cols: ["name"] },
  { table: "suppliers", pk: "id", cols: ["name", "address"] },
  { table: "asset_statuses", pk: "id", cols: ["name"] },
  { table: "users", pk: "id", cols: ["full_name"] },
  { table: "roles", pk: "id", cols: ["name", "description"] },
  { table: "permissions", pk: "id", cols: ["name"] },
  { table: "system_settings", pk: "id", cols: ["value", "label"] },
  { table: "materials", pk: "id", cols: ["name", "description"] },
  { table: "material_categories", pk: "id", cols: ["name"] },
  { table: "warehouses", pk: "id", cols: ["name"] },
  { table: "land_parcels", pk: "id", cols: ["parcel_no", "title", "plot_no", "address", "responsible_unit", "donor_name", "notes", "area_text", "phone"] },
  { table: "import_batches", pk: "id", cols: ["file_name", "notes", "error_summary"] },
  { table: "import_staging_rows", pk: "id", cols: ["item_name", "asset_code", "category_name", "location_text", "brand_model", "budget_type", "acquire_method", "document_ref", "vendor_name", "vendor_address", "validation_errors", "validation_warnings", "raw_json"] },
  { table: "notifications", pk: "id", cols: ["title", "message"] },
  { table: "inspection_campaigns", pk: "id", cols: ["title", "notes"] },
  { table: "inspection_items", pk: "id", cols: ["condition_note", "location_found"] },
  { table: "audit_logs", pk: "id", cols: ["detail"] },
  { table: "maintenance_orders", pk: "id", cols: ["title", "description", "vendor_name"] },
  { table: "asset_transfers", pk: "id", cols: ["reason", "notes"] },
  { table: "asset_disposals", pk: "id", cols: ["reason", "notes"] },
  { table: "stock_receipts", pk: "id", cols: ["ref_no", "notes"] },
  { table: "stock_issues", pk: "id", cols: ["ref_no", "notes"] },
];

const url = new URL(process.env.DATABASE_URL);
const conn = await mariadb.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  charset: "utf8mb4",
});

await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

const report = [];
let totalUpdated = 0;

for (const t of TARGETS) {
  const exists = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA='tsl_asset' AND TABLE_NAME=?`,
    [t.table],
  );
  if (Number(exists[0].c) === 0) continue;

  const realCols = [];
  for (const c of t.cols) {
    const col = await conn.query(
      `SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='tsl_asset' AND TABLE_NAME=? AND COLUMN_NAME=?`,
      [t.table, c],
    );
    if (Number(col[0].c) > 0) realCols.push(c);
  }
  if (realCols.length === 0) continue;

  const rows = await conn.query(
    `SELECT \`${t.pk}\`, ${realCols.map((c) => `\`${c}\``).join(", ")} FROM \`${t.table}\``,
  );

  let updatedRows = 0;
  let updatedCells = 0;

  for (const row of rows) {
    const sets = [];
    const params = [];
    for (const c of realCols) {
      const v = row[c];
      if (typeof v !== "string") continue;
      const fixed = fixThaiMojibake(v);
      if (fixed !== v) {
        sets.push(`\`${c}\` = ?`);
        params.push(fixed);
        updatedCells++;
      }
    }
    if (sets.length === 0) continue;
    params.push(row[t.pk]);
    await conn.query(
      `UPDATE \`${t.table}\` SET ${sets.join(", ")} WHERE \`${t.pk}\` = ?`,
      params,
    );
    updatedRows++;
  }

  totalUpdated += updatedCells;
  report.push({ table: t.table, rows: rows.length, updatedRows, updatedCells });
  console.log(`${t.table}: rows=${rows.length} updatedRows=${updatedRows} cells=${updatedCells}`);
}

// verify samples
const sampleAssets = await conn.query(
  `SELECT asset_code, item_name FROM assets ORDER BY created_at ASC LIMIT 5`,
);
const sampleUsers = await conn.query(`SELECT username, full_name FROM users`);
const sampleDepts = await conn.query(`SELECT code, name FROM departments`);
const sampleCats = await conn.query(`SELECT name FROM asset_categories`);

const summary = {
  totalUpdatedCells: totalUpdated,
  report,
  samples: { sampleAssets, sampleUsers, sampleDepts, sampleCats },
};

fs.writeFileSync("scripts/repair-thai-report.json", JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify({ totalUpdatedCells: totalUpdated, samples: summary.samples }, null, 2));
await conn.end();
