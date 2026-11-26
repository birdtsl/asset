import { prisma } from "@/lib/prisma";

/** Live executive KPIs — always from DB, never hardcoded. */
export async function getExecutiveKpis() {
  const [
    normalAssets,
    lowValueAssets,
    landParcels,
    materials,
    openMaintenance,
    openTransfers,
    openDisposals,
    openInspectionPending,
    qrReady,
    draftReceipts,
    draftIssues,
    recentAudit,
  ] = await Promise.all([
    prisma.asset.count({ where: { assetClass: "NORMAL", isActive: true } }),
    prisma.asset.count({ where: { assetClass: "LOW_VALUE", isActive: true } }),
    prisma.landParcel.count({ where: { isActive: true } }),
    prisma.material.count({ where: { isActive: true } }),
    prisma.maintenanceOrder.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.assetTransfer.count({
      where: { status: { in: ["DRAFT", "APPROVED"] } },
    }),
    prisma.assetDisposal.count({
      where: { status: { in: ["DRAFT", "APPROVED"] } },
    }),
    prisma.inspectionItem.count({
      where: {
        result: "PENDING",
        campaign: { status: "IN_PROGRESS" },
      },
    }),
    prisma.asset.count({
      where: { isActive: true, qrToken: { not: null } },
    }),
    prisma.stockReceipt.count({ where: { status: "DRAFT" } }),
    prisma.stockIssue.count({ where: { status: "DRAFT" } }),
    prisma.auditLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const stockValueAgg = await prisma.$queryRaw<{ value: unknown }[]>`
    SELECT COALESCE(SUM(quantity * avg_cost), 0) AS value
    FROM stock_balances
  `;
  const stockValue = Number(stockValueAgg[0]?.value ?? 0);

  const lowStock = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS count
    FROM (
      SELECT m.id
      FROM materials m
      INNER JOIN stock_balances sb ON sb.material_id = m.id
      WHERE m.is_active = 1
      GROUP BY m.id, m.min_stock, m.reorder_point
      HAVING SUM(sb.quantity) <= GREATEST(m.min_stock, m.reorder_point)
         AND GREATEST(m.min_stock, m.reorder_point) > 0
    ) t
  `;

  const assetValueAgg = await prisma.$queryRaw<{ value: unknown }[]>`
    SELECT COALESCE(SUM(unit_price * quantity), 0) AS value
    FROM assets
    WHERE is_active = 1 AND asset_class = 'NORMAL'
  `;
  const assetBookValue = Number(assetValueAgg[0]?.value ?? 0);

  return {
    normalAssets,
    lowValueAssets,
    landParcels,
    materials,
    openMaintenance,
    openTransfers,
    openDisposals,
    openInspectionPending,
    qrReady,
    draftReceipts,
    draftIssues,
    recentAudit,
    stockValue,
    lowStockCount: Number(lowStock[0]?.count ?? 0),
    assetBookValue,
  };
}

export async function getAssetReportByCategory() {
  const rows = await prisma.asset.groupBy({
    by: ["categoryName", "assetClass"],
    where: { isActive: true },
    _count: { _all: true },
  });
  return rows
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 30);
}

export async function getAssetReportByLocation() {
  const rows = await prisma.asset.groupBy({
    by: ["locationText"],
    where: { isActive: true },
    _count: { _all: true },
  });
  return rows
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 20);
}
