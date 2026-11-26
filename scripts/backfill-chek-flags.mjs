/**
 * Backfill check_* flags from stored Excel "chek" sheets.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function clean(value) {
  if (value == null) return "";
  return String(value).replace(/\u00a0/g, " ").trim();
}

function marked(value) {
  const s = clean(value);
  return Boolean(s && s !== "-" && s !== "0" && s !== "false");
}

function findHeaderIndex(headers, alias) {
  const target = alias.replace(/\s+/g, " ").trim();
  const normalized = headers.map((h) => h.replace(/\s+/g, " ").trim());
  let idx = normalized.findIndex((h) => h === target);
  if (idx >= 0) return idx;
  return normalized.findIndex((h) => h.includes(target));
}

function parseChek(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: false });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase() === "chek") ||
    wb.SheetNames.find((n) => n.toLowerCase() === "check");
  if (!sheetName) return [];
  const matrix = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
  });

  let headerIdx = -1;
  for (let i = 0; i < Math.min(12, matrix.length); i++) {
    const row = (matrix[i] || []).map(clean);
    if (findHeaderIndex(row, "รหัสครุภัณฑ์") >= 0 && findHeaderIndex(row, "ชำรุด") >= 0) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return [];

  const header = (matrix[headerIdx] || []).map(clean);
  const iCode = findHeaderIndex(header, "รหัสครุภัณฑ์");
  const iDamaged = findHeaderIndex(header, "ชำรุด");
  const iDeteriorated = findHeaderIndex(header, "เสื่อมสภาพ");
  const iLost = findHeaderIndex(header, "สูญไป");
  const iUnused = findHeaderIndex(header, "ไม่ใช้");
  const iInUse = findHeaderIndex(header, "ใช้อยู่");
  const iRemark = findHeaderIndex(header, "หมายเหตุ");
  if (iCode < 0) return [];

  const out = [];
  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const line = matrix[i] || [];
    const assetCode = clean(line[iCode]);
    if (!assetCode) continue;
    out.push({
      assetCode,
      checkDamaged: iDamaged >= 0 ? marked(line[iDamaged]) : false,
      checkDeteriorated: iDeteriorated >= 0 ? marked(line[iDeteriorated]) : false,
      checkLost: iLost >= 0 ? marked(line[iLost]) : false,
      checkUnused: iUnused >= 0 ? marked(line[iUnused]) : false,
      checkInUse: iInUse >= 0 ? marked(line[iInUse]) : false,
      checkRemark: iRemark >= 0 ? clean(line[iRemark]) || null : null,
    });
  }
  return out;
}

const u = new URL(process.env.DATABASE_URL);
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
  }),
});

const importDir = path.resolve("storage/imports");
const files = fs
  .readdirSync(importDir)
  .filter((f) => /\.xls[xm]?$/i.test(f))
  .map((f) => path.join(importDir, f));

const byCode = new Map();
for (const file of files) {
  const rows = parseChek(fs.readFileSync(file));
  for (const row of rows) byCode.set(row.assetCode, row);
  console.log(path.basename(file), "chek rows:", rows.length);
}

let updated = 0;
let matched = 0;
for (const [assetCode, flags] of byCode) {
  const asset = await prisma.asset.findFirst({
    where: { assetCode },
    select: { id: true },
  });
  if (!asset) continue;
  matched += 1;
  await prisma.asset.update({
    where: { id: asset.id },
    data: {
      checkDamaged: flags.checkDamaged,
      checkDeteriorated: flags.checkDeteriorated,
      checkLost: flags.checkLost,
      checkUnused: flags.checkUnused,
      checkInUse: flags.checkInUse,
      checkRemark: flags.checkRemark,
    },
  });
  updated += 1;
}

const damaged = await prisma.asset.count({ where: { checkDamaged: true } });
const inUse = await prisma.asset.count({ where: { checkInUse: true } });
console.log(JSON.stringify({ files: files.length, unique: byCode.size, matched, updated, damaged, inUse }, null, 2));
await prisma.$disconnect();
