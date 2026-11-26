import type { AssetClass, Prisma } from "@prisma/client";
import { UNCATEGORIZED } from "@/lib/assets/list-query";
import {
  checkStatusWhere,
  type CheckStatusCode,
} from "@/lib/assets/check-status";

export function parseCategoryParam(categoryParam?: string) {
  if (!categoryParam) return undefined;
  if (categoryParam === UNCATEGORIZED) return null;
  return categoryParam.trim() || undefined;
}

export function buildAssetListWhere(opts: {
  assetClass: AssetClass;
  category?: string | null;
  checkStatus?: CheckStatusCode;
  itemName?: string;
  query?: string;
}): Prisma.AssetWhereInput {
  const { assetClass, category, checkStatus, itemName, query } = opts;

  return {
    assetClass,
    isActive: true,
    ...(category === null
      ? { categoryName: null }
      : category
        ? { categoryName: category }
        : {}),
    ...checkStatusWhere(checkStatus),
    ...(itemName ? { itemName } : {}),
    ...(query
      ? {
          OR: [
            { assetCode: { contains: query } },
            { typeCode: { contains: query } },
            { itemName: { contains: query } },
            { categoryName: { contains: query } },
            { locationText: { contains: query } },
          ],
        }
      : {}),
  };
}
