import { AssetExecutiveDashboard } from "@/components/dashboard/asset-executive-dashboard";

export const dynamic = "force-dynamic";

/** แดชบอร์ดสาธารณะสำหรับฝังใน TSL MIS — ไม่ต้อง login */
export default function EmbedDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <AssetExecutiveDashboard publicMode />
    </div>
  );
}
