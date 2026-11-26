import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import fs from "fs";

function isBroken(s) {
  if (!s) return false;
  if (/[\u0080-\u009F]/.test(s)) return true;
  if (s.includes("\uFFFD") && /เ[ธน]/.test(s)) return true;
  const triples = (s.match(/เธ./g) || []).length;
  const thai = (s.match(/[\u0E00-\u0E7F]/g) || []).length;
  return thai >= 4 && triples >= 1 && triples * 2 >= thai * 0.4;
}

function encode(str) {
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
    for (const b of Buffer.from(ch, "utf8")) out.push(b);
  }
  return Buffer.from(out);
}

function fix(s) {
  if (!s || !isBroken(s)) return s;
  const f = encode(s).toString("utf8");
  if (!f || f.includes("\uFFFD") || isBroken(f)) return s;
  return f;
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
    collation: "utf8mb4_unicode_ci",
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
  }),
});

const rows = await prisma.landParcel.findMany();
let updated = 0;
for (const r of rows) {
  const data = {};
  for (const [k, v] of Object.entries({
    parcelNo: r.parcelNo,
    title: r.title,
    plotNo: r.plotNo,
    address: r.address,
    responsibleUnit: r.responsibleUnit,
    donorName: r.donorName,
    areaText: r.areaText,
    notes: r.notes,
  })) {
    if (typeof v !== "string") continue;
    const f = fix(v);
    if (f !== v) data[k] = f;
  }
  if (Object.keys(data).length === 0) continue;
  await prisma.landParcel.update({ where: { id: r.id }, data });
  updated += 1;
}

const after = await prisma.landParcel.findMany({
  select: { parcelNo: true, plotNo: true, title: true },
  orderBy: { parcelNo: "asc" },
});
fs.writeFileSync(
  "scripts/land-encoding.json",
  JSON.stringify({ updated, after }, null, 2),
  "utf8",
);
console.log(JSON.stringify({ updated, after }, null, 2));
await prisma.$disconnect();
