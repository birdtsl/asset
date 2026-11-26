import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { AssetListTable } from "@/components/assets/asset-list";
import { CategoryFilterCards } from "@/components/assets/category-filter-cards";
import { StatusFilterBar } from "@/components/assets/status-filter-bar";
import { ItemFilterSelect } from "@/components/assets/item-filter-select";
import {
  CHECK_STATUSES,
  checkStatusLabel,
  parseCheckStatus,
} from "@/lib/assets/check-status";
import { loadCategoryCards } from "@/lib/assets/category-status";
import {
  buildAssetListWhere,
  parseCategoryParam,
} from "@/lib/assets/list-where";
import { Upload } from "lucide-react";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    item?: string;
  }>;
}) {
  const {
    q,
    category: categoryParam,
    status: statusParam,
    item: itemParam,
  } = await searchParams;
  const query = q?.trim() || "";
  const category = parseCategoryParam(categoryParam);
  const checkStatus = parseCheckStatus(statusParam);
  const itemName = itemParam?.trim() || undefined;

  const baseWhere = buildAssetListWhere({ assetClass: "NORMAL" });
  const statusScopeWhere = buildAssetListWhere({
    assetClass: "NORMAL",
    category,
    itemName,
  });
  const itemScopeWhere = buildAssetListWhere({
    assetClass: "NORMAL",
    category,
    checkStatus,
  });
  const filterWhere = buildAssetListWhere({
    assetClass: "NORMAL",
    category,
    checkStatus,
    itemName,
    query: query || undefined,
  });

  const [
    rows,
    total,
    filteredTotal,
    categoryCards,
    itemGroups,
    statusScopeTotal,
    ...statusCounts
  ] = await Promise.all([
    prisma.asset.findMany({
      where: filterWhere,
      orderBy: [{ categoryName: "asc" }, { assetCode: "asc" }],
      take: 100,
      include: { status: true, location: true },
    }),
    prisma.asset.count({ where: baseWhere }),
    prisma.asset.count({ where: filterWhere }),
    loadCategoryCards({
      assetClass: "NORMAL",
      itemName,
    }),
    prisma.asset.groupBy({
      by: ["itemName"],
      where: itemScopeWhere,
      _count: { _all: true },
      orderBy: { _count: { itemName: "desc" } },
    }),
    prisma.asset.count({ where: statusScopeWhere }),
    ...CHECK_STATUSES.map((s) =>
      prisma.asset.count({
        where: buildAssetListWhere({
          assetClass: "NORMAL",
          category,
          itemName,
          checkStatus: s.code,
        }),
      }),
    ),
  ]);

  const statusOptions = CHECK_STATUSES.map((s, i) => ({
    code: s.code,
    name: s.name,
    count: Number(statusCounts[i] ?? 0),
  }));

  const itemOptions = itemGroups.map((g) => ({
    name: g.itemName,
    count: g._count._all,
  }));

  const selectedCategoryLabel =
    category === null ? "ไม่ระบุประเภท" : category || null;
  const filterLabel = [
    selectedCategoryLabel,
    itemName,
    checkStatusLabel(checkStatus),
  ]
    .filter(Boolean)
    .join(" · ");

  const listQuery = {
    q: query || undefined,
    category: categoryParam,
    status: checkStatus,
    item: itemName,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="ทะเบียนครุภัณฑ์"
        description={
          filterLabel
            ? `${filterLabel} · ${filteredTotal.toLocaleString("th-TH")} รายการ (แสดงสูงสุด 100)`
            : `ทั้งหมด ${total.toLocaleString("th-TH")} รายการ (แสดงสูงสุด 100)`
        }
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/assets/low-value">ต่ำกว่าเกณฑ์</Link>
            </Button>
            <Button asChild>
              <Link href="/assets/import">
                <Upload className="h-4 w-4" />
                นำเข้า Excel
              </Link>
            </Button>
          </div>
        }
      />

      <CategoryFilterCards
        basePath="/assets"
        categories={categoryCards.categories}
        total={categoryCards.total}
        totalStatus={categoryCards.totalStatus}
        selected={categoryParam}
        query={listQuery}
      />

      <form className="flex gap-2">
        {categoryParam ? (
          <input type="hidden" name="category" value={categoryParam} />
        ) : null}
        {checkStatus ? (
          <input type="hidden" name="status" value={checkStatus} />
        ) : null}
        {itemName ? (
          <input type="hidden" name="item" value={itemName} />
        ) : null}
        <input
          name="q"
          defaultValue={query}
          placeholder="ค้นหากำหนดรหัส / รหัสครุภัณฑ์ / ชื่อ / สถานที่"
          className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
        />
        <Button type="submit" variant="secondary">
          ค้นหา
        </Button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilterBar
          basePath="/assets"
          statuses={statusOptions}
          total={statusScopeTotal}
          selected={checkStatus}
          query={listQuery}
        />
        <ItemFilterSelect
          basePath="/assets"
          items={itemOptions}
          selected={itemName}
          query={listQuery}
        />
      </div>

      <AssetListTable
        rows={rows}
        emptyText="ยังไม่มีข้อมูลครุภัณฑ์ตามเงื่อนไขที่เลือก"
      />
    </div>
  );
}
