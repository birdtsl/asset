/**
 * Repair receive_month mojibake and fill missing received_at from day/month/year.
 * Uses the app Prisma client (utf8mb4 adapter) so Thai writes correctly.
 */
import { prisma } from "../src/lib/prisma.ts";
import {
  buildReceivedAt,
  normalizeThaiMonth,
} from "../src/lib/excel/asset-import.ts";

const rows = await prisma.$queryRaw`
  SELECT
    id,
    receive_day AS receiveDay,
    receive_year_be AS receiveYearBe,
    HEX(receive_month) AS monthHex,
    CASE WHEN received_at IS NULL THEN 0 ELSE 1 END AS hasReceived
  FROM assets
`;

let monthFixed = 0;
let dateFilled = 0;
let skipped = 0;
let failed = 0;

for (const row of rows) {
  const rawMonth = row.monthHex
    ? Buffer.from(row.monthHex, "hex").toString("utf8")
    : null;
  const month = normalizeThaiMonth(rawMonth);
  const day = row.receiveDay != null ? Number(row.receiveDay) : null;
  const yearBe =
    row.receiveYearBe != null ? Number(row.receiveYearBe) : null;
  const receivedAt = buildReceivedAt(day, month ?? rawMonth, yearBe);

  const needMonth = Boolean(month && month !== rawMonth);
  const needDate = Boolean(receivedAt && Number(row.hasReceived) === 0);

  if (!needMonth && !needDate) {
    skipped += 1;
    continue;
  }

  try {
    await prisma.asset.update({
      where: { id: row.id },
      data: {
        ...(needMonth ? { receiveMonth: month } : {}),
        ...(needDate ? { receivedAt } : {}),
      },
    });
    if (needMonth) monthFixed += 1;
    if (needDate) dateFilled += 1;
  } catch (e) {
    failed += 1;
    if (failed <= 3) {
      console.error("update failed", row.id, e.message);
    }
  }
}

const after = await prisma.$queryRaw`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN received_at IS NULL THEN 1 ELSE 0 END) AS no_received
  FROM assets
`;

const monthCheck = await prisma.$queryRaw`
  SELECT HEX(receive_month) AS month_hex, COUNT(*) AS cnt
  FROM assets
  WHERE receive_month IS NOT NULL
  GROUP BY receive_month
  ORDER BY cnt DESC
  LIMIT 15
`;

console.log(
  JSON.stringify(
    {
      scanned: rows.length,
      monthFixed,
      dateFilled,
      skipped,
      failed,
      after: after.map((r) => ({
        total: Number(r.total),
        no_received: Number(r.no_received),
      })),
      months: monthCheck.map((r) => ({
        cnt: Number(r.cnt),
        text: r.month_hex
          ? Buffer.from(r.month_hex, "hex").toString("utf8")
          : null,
        hex: r.month_hex,
      })),
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
