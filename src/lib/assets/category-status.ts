import type { AssetClass } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildAssetListWhere } from "@/lib/assets/list-where";
import type { CheckStatusCode } from "@/lib/assets/check-status";

export type CategoryStatusSummary = {
  inUse: number;
  damaged: number;
  deteriorated: number;
  lost: number;
  unused: number;
};

export type CategoryCount = {
  name: string | null;
  count: number;
  status: CategoryStatusSummary;
};

export function emptyStatusSummary(): CategoryStatusSummary {
  return { inUse: 0, damaged: 0, deteriorated: 0, lost: 0, unused: 0 };
}

export function aggregateCategoryStatus(
  rows: Array<{
    categoryName: string | null;
    checkInUse: boolean;
    checkDamaged: boolean;
    checkDeteriorated: boolean;
    checkLost: boolean;
    checkUnused: boolean;
  }>,
) {
  const byCategory = new Map<string | null, CategoryStatusSummary>();
  const total = emptyStatusSummary();

  for (const row of rows) {
    const key = row.categoryName;
    let bucket = byCategory.get(key);
    if (!bucket) {
      bucket = emptyStatusSummary();
      byCategory.set(key, bucket);
    }
    if (row.checkInUse) {
      bucket.inUse += 1;
      total.inUse += 1;
    }
    if (row.checkDamaged) {
      bucket.damaged += 1;
      total.damaged += 1;
    }
    if (row.checkDeteriorated) {
      bucket.deteriorated += 1;
      total.deteriorated += 1;
    }
    if (row.checkLost) {
      bucket.lost += 1;
      total.lost += 1;
    }
    if (row.checkUnused) {
      bucket.unused += 1;
      total.unused += 1;
    }
  }

  return { byCategory, total };
}

export async function loadCategoryCards(opts: {
  assetClass: AssetClass;
  checkStatus?: CheckStatusCode;
  itemName?: string;
}): Promise<{
  categories: CategoryCount[];
  total: number;
  totalStatus: CategoryStatusSummary;
}> {
  const where = buildAssetListWhere({
    assetClass: opts.assetClass,
    checkStatus: opts.checkStatus,
    itemName: opts.itemName,
  });

  const [groups, flagRows] = await Promise.all([
    prisma.asset.groupBy({
      by: ["categoryName"],
      where,
      _count: { _all: true },
      orderBy: { _count: { categoryName: "desc" } },
    }),
    prisma.asset.findMany({
      where,
      select: {
        categoryName: true,
        checkInUse: true,
        checkDamaged: true,
        checkDeteriorated: true,
        checkLost: true,
        checkUnused: true,
      },
    }),
  ]);

  const { byCategory, total: totalStatus } = aggregateCategoryStatus(flagRows);

  const categories: CategoryCount[] = groups.map((g) => ({
    name: g.categoryName,
    count: g._count._all,
    status: byCategory.get(g.categoryName) ?? emptyStatusSummary(),
  }));

  return {
    categories,
    total: flagRows.length,
    totalStatus,
  };
}
