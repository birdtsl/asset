/**
 * Repair validation_errors / validation_warnings / raw_json Thai mojibake
 * left behind after the first repair pass.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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
      out.push(0xa0);
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
  if (!fixed || fixed.includes("\uFFFD") || isBrokenThaiMojibake(fixed)) return input;
  return fixed;
}

const url = process.env.DATABASE_URL;
const parsed = new URL(url);
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
    collation: "utf8mb4_unicode_ci",
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
  }),
});

const cols = ["validation_errors", "validation_warnings", "raw_json"];
const rows = await prisma.$queryRawUnsafe(
  `SELECT id, validation_errors, validation_warnings, raw_json
   FROM import_staging_rows`,
);

let updated = 0;
for (const row of rows) {
  const data = {};
  for (const c of cols) {
    const v = row[c];
    if (typeof v !== "string") continue;
    const fixed = fixThaiMojibake(v);
    if (fixed !== v) data[c === "validation_errors" ? "validationErrors" : c === "validation_warnings" ? "validationWarnings" : "rawJson"] = fixed;
  }
  if (Object.keys(data).length === 0) continue;
  await prisma.importStagingRow.update({ where: { id: row.id }, data });
  updated += 1;
}

// also fix import batch error_summary / notes / file_name if needed
const batches = await prisma.importBatch.findMany({
  select: { id: true, fileName: true, notes: true, errorSummary: true },
});
let batchUpdated = 0;
for (const b of batches) {
  const data = {};
  for (const [key, val] of [
    ["fileName", b.fileName],
    ["notes", b.notes],
    ["errorSummary", b.errorSummary],
  ]) {
    if (typeof val !== "string") continue;
    const fixed = fixThaiMojibake(val);
    if (fixed !== val) data[key] = fixed;
  }
  if (Object.keys(data).length === 0) continue;
  await prisma.importBatch.update({ where: { id: b.id }, data });
  batchUpdated += 1;
}

const sample = await prisma.importStagingRow.findFirst({
  where: { status: "ERROR" },
  select: { validationErrors: true, assetCode: true },
});

console.log(
  JSON.stringify(
    {
      stagingRowsUpdated: updated,
      batchesUpdated: batchUpdated,
      sample,
    },
    null,
    2,
  ),
);
await prisma.$disconnect();
