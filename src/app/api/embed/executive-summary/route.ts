import { getAssetExecutiveSummary } from "@/lib/reports/asset-executive";
import { getExecutiveKpis } from "@/lib/reports/executive-kpis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * สรุปครุภัณฑ์สำหรับ TSL MIS (แท็บทรัพยากรคลัง)
 * ไม่ต้อง login — แอป Smart Asset หลักยังล็อกอินตามเดิม
 */
export async function GET() {
  try {
    const [summary, kpis] = await Promise.all([
      getAssetExecutiveSummary(),
      getExecutiveKpis(),
    ]);
    return NextResponse.json({
      ok: true,
      service: "tsl-smart-asset",
      generatedAt: summary.generatedAt.toISOString(),
      summary: {
        totalAssets: summary.totalAssets,
        totalValue: summary.totalValue,
        healthyCount: summary.healthyCount,
        attentionCount: summary.attentionCount,
        recentSyncAt: summary.recentSyncAt?.toISOString() ?? null,
        recentSyncDevice: summary.recentSyncDevice,
        normal: {
          total: summary.normal.total,
          bookValue: summary.normal.bookValue,
          inUse: summary.normal.inUse,
          damaged: summary.normal.damaged,
          deteriorated: summary.normal.deteriorated,
          lost: summary.normal.lost,
          unused: summary.normal.unused,
          noStatus: summary.normal.noStatus,
          topCategories: summary.normal.topCategories,
          topLocations: summary.normal.topLocations,
        },
        lowValue: {
          total: summary.lowValue.total,
          bookValue: summary.lowValue.bookValue,
          inUse: summary.lowValue.inUse,
          damaged: summary.lowValue.damaged,
          deteriorated: summary.lowValue.deteriorated,
          lost: summary.lowValue.lost,
          unused: summary.lowValue.unused,
          noStatus: summary.lowValue.noStatus,
          topCategories: summary.lowValue.topCategories,
          topLocations: summary.lowValue.topLocations,
        },
      },
      kpis: {
        landParcels: kpis.landParcels,
        materials: kpis.materials,
        openInspectionPending: kpis.openInspectionPending,
        openMaintenance: kpis.openMaintenance,
        openTransfers: kpis.openTransfers,
        openDisposals: kpis.openDisposals,
        lowStockCount: kpis.lowStockCount,
        recentAudit: kpis.recentAudit,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}
