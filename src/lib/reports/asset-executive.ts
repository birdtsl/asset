import { prisma } from "@/lib/prisma";
import type { AssetClass } from "@prisma/client";

export type NamedMetric = {
  name: string;
  count: number;
  value: number;
};

export type AssetClassSnapshot = {
  assetClass: AssetClass;
  total: number;
  bookValue: number;
  inUse: number;
  damaged: number;
  deteriorated: number;
  lost: number;
  unused: number;
  noStatus: number;
  inUseValue: number;
  damagedValue: number;
  deterioratedValue: number;
  lostValue: number;
  unusedValue: number;
  noStatusValue: number;
  topCategories: NamedMetric[];
  topLocations: NamedMetric[];
};

async function loadClassSnapshot(
  assetClass: AssetClass,
): Promise<AssetClassSnapshot> {
  const [
    totals,
    statusValues,
    categories,
    locations,
  ] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        total: unknown;
        book_value: unknown;
        in_use: unknown;
        damaged: unknown;
        deteriorated: unknown;
        lost: unknown;
        unused: unknown;
      }>
    >`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(unit_price * quantity), 0) AS book_value,
        SUM(CASE WHEN check_in_use = 1 THEN 1 ELSE 0 END) AS in_use,
        SUM(CASE WHEN check_damaged = 1 THEN 1 ELSE 0 END) AS damaged,
        SUM(CASE WHEN check_deteriorated = 1 THEN 1 ELSE 0 END) AS deteriorated,
        SUM(CASE WHEN check_lost = 1 THEN 1 ELSE 0 END) AS lost,
        SUM(CASE WHEN check_unused = 1 THEN 1 ELSE 0 END) AS unused
      FROM assets
      WHERE is_active = 1 AND asset_class = ${assetClass}
    `,
    prisma.$queryRaw<
      Array<{
        in_use_value: unknown;
        damaged_value: unknown;
        deteriorated_value: unknown;
        lost_value: unknown;
        unused_value: unknown;
        no_status_value: unknown;
      }>
    >`
      SELECT
        COALESCE(SUM(CASE WHEN check_in_use = 1 THEN unit_price * quantity ELSE 0 END), 0) AS in_use_value,
        COALESCE(SUM(CASE WHEN check_damaged = 1 THEN unit_price * quantity ELSE 0 END), 0) AS damaged_value,
        COALESCE(SUM(CASE WHEN check_deteriorated = 1 THEN unit_price * quantity ELSE 0 END), 0) AS deteriorated_value,
        COALESCE(SUM(CASE WHEN check_lost = 1 THEN unit_price * quantity ELSE 0 END), 0) AS lost_value,
        COALESCE(SUM(CASE WHEN check_unused = 1 THEN unit_price * quantity ELSE 0 END), 0) AS unused_value,
        COALESCE(SUM(CASE
          WHEN check_in_use = 0 AND check_damaged = 0 AND check_deteriorated = 0
           AND check_lost = 0 AND check_unused = 0
          THEN unit_price * quantity ELSE 0 END), 0) AS no_status_value
      FROM assets
      WHERE is_active = 1 AND asset_class = ${assetClass}
    `,
    prisma.$queryRaw<
      Array<{ category_name: string | null; cnt: unknown; value: unknown }>
    >`
      SELECT
        category_name,
        COUNT(*) AS cnt,
        COALESCE(SUM(unit_price * quantity), 0) AS value
      FROM assets
      WHERE is_active = 1 AND asset_class = ${assetClass}
      GROUP BY category_name
      ORDER BY cnt DESC
      LIMIT 6
    `,
    prisma.$queryRaw<
      Array<{ location_text: string | null; cnt: unknown; value: unknown }>
    >`
      SELECT
        location_text,
        COUNT(*) AS cnt,
        COALESCE(SUM(unit_price * quantity), 0) AS value
      FROM assets
      WHERE is_active = 1
        AND asset_class = ${assetClass}
        AND location_text IS NOT NULL
        AND location_text <> ''
        AND location_text NOT REGEXP '^[0-9]+$'
      GROUP BY location_text
      ORDER BY cnt DESC
      LIMIT 5
    `,
  ]);

  const t = totals[0];
  const sv = statusValues[0];
  const total = Number(t?.total ?? 0);
  const inUse = Number(t?.in_use ?? 0);
  const damaged = Number(t?.damaged ?? 0);
  const deteriorated = Number(t?.deteriorated ?? 0);
  const lost = Number(t?.lost ?? 0);
  const unused = Number(t?.unused ?? 0);
  const flagged = inUse + damaged + deteriorated + lost + unused;

  return {
    assetClass,
    total,
    bookValue: Number(t?.book_value ?? 0),
    inUse,
    damaged,
    deteriorated,
    lost,
    unused,
    noStatus: Math.max(0, total - flagged),
    inUseValue: Number(sv?.in_use_value ?? 0),
    damagedValue: Number(sv?.damaged_value ?? 0),
    deterioratedValue: Number(sv?.deteriorated_value ?? 0),
    lostValue: Number(sv?.lost_value ?? 0),
    unusedValue: Number(sv?.unused_value ?? 0),
    noStatusValue: Number(sv?.no_status_value ?? 0),
    topCategories: categories.map((c) => ({
      name: c.category_name?.trim() || "ไม่ระบุประเภท",
      count: Number(c.cnt ?? 0),
      value: Number(c.value ?? 0),
    })),
    topLocations: locations.map((l) => ({
      name: (l.location_text || "").trim(),
      count: Number(l.cnt ?? 0),
      value: Number(l.value ?? 0),
    })),
  };
}

export async function getAssetExecutiveSummary() {
  const [normal, lowValue, recentSync] = await Promise.all([
    loadClassSnapshot("NORMAL"),
    loadClassSnapshot("LOW_VALUE"),
    prisma.auditLog.findFirst({
      where: { action: "SYNC_AGENT_UPSERT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, entityId: true },
    }),
  ]);

  const attention =
    normal.damaged +
    normal.lost +
    normal.unused +
    lowValue.damaged +
    lowValue.lost +
    lowValue.unused;

  return {
    normal,
    lowValue,
    totalAssets: normal.total + lowValue.total,
    totalValue: normal.bookValue + lowValue.bookValue,
    attentionCount: attention,
    healthyCount: normal.inUse + lowValue.inUse,
    recentSyncAt: recentSync?.createdAt ?? null,
    recentSyncDevice: recentSync?.entityId ?? null,
    generatedAt: new Date(),
  };
}
