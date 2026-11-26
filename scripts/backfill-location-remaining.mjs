import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function fixThai(s) {
  if (!s) return s;
  if (!/[\u0080-\u009F]/.test(s) && !/เธ./.test(s)) return s;
  const out = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp === 0xfffd) out.push(0xa0);
    else if (cp <= 0x9f) out.push(cp);
    else if (cp >= 0x0e01 && cp <= 0x0e5b) out.push(cp - 0x0e00 + 0xa0);
    else for (const b of Buffer.from(ch, "utf8")) out.push(b);
  }
  const fixed = Buffer.from(out).toString("utf8");
  return fixed.includes("\uFFFD") ? s : fixed;
}

function extractLocation(raw) {
  const keys = Object.keys(raw || {});
  const preferred = keys.find((k) =>
    String(k).replace(/\s+/g, " ").includes("สถานที่ตั้ง/ผู้รับผิดชอบ"),
  );
  if (!preferred) return null;
  const v = String(raw[preferred] ?? "").trim();
  if (!v || v === "-" || /^\d+$/.test(v)) return null;
  return fixThai(v);
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

const numericAssets = await prisma.$queryRaw`
  SELECT id, asset_code, location_text, source_batch_id, source_row_no
  FROM assets
  WHERE location_text REGEXP '^[0-9]+$'
`;

let updated = 0;
const samples = [];

for (const a of numericAssets) {
  let loc = null;

  if (a.source_batch_id && a.source_row_no != null) {
    const staging = await prisma.importStagingRow.findFirst({
      where: { batchId: a.source_batch_id, rowNo: a.source_row_no },
      select: { rawJson: true, locationText: true },
    });
    if (staging) {
      try {
        loc = extractLocation(JSON.parse(staging.rawJson || "{}"));
      } catch {
        loc = null;
      }
      if (!loc && staging.locationText && !/^\d+$/.test(staging.locationText)) {
        loc = staging.locationText;
      }
    }
  }

  if (!loc && a.asset_code) {
    const staging = await prisma.importStagingRow.findFirst({
      where: { assetCode: a.asset_code },
      orderBy: { createdAt: "desc" },
      select: { rawJson: true, locationText: true },
    });
    if (staging) {
      try {
        loc = extractLocation(JSON.parse(staging.rawJson || "{}"));
      } catch {
        loc = null;
      }
      if (!loc && staging.locationText && !/^\d+$/.test(staging.locationText)) {
        loc = staging.locationText;
      }
    }
  }

  if (!loc) continue;
  await prisma.asset.update({
    where: { id: a.id },
    data: { locationText: loc },
  });
  updated += 1;
  if (samples.length < 8) {
    samples.push({ code: a.asset_code, from: a.location_text, to: loc });
  }
}

const still = await prisma.$queryRaw`
  SELECT COUNT(*) AS c FROM assets WHERE location_text REGEXP '^[0-9]+$'
`;
const named = await prisma.$queryRaw`
  SELECT location_text AS loc, COUNT(*) AS c
  FROM assets
  WHERE location_text IS NOT NULL AND location_text NOT REGEXP '^[0-9]+$'
  GROUP BY location_text
  ORDER BY c DESC
  LIMIT 12
`;

console.log(
  JSON.stringify(
    {
      remainingBefore: numericAssets.length,
      updated,
      stillNumeric: Number(still[0].c),
      samples,
      topLocations: named.map((r) => ({
        loc: r.loc,
        c: Number(r.c),
      })),
    },
    null,
    2,
  ),
);
await prisma.$disconnect();
