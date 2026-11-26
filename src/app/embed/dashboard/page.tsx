import { AssetExecutiveDashboard } from "@/components/dashboard/asset-executive-dashboard";

export const dynamic = "force-dynamic";

/**
 * หน้า dashboard ชุดเดียวกับ /dashboard (คอมโพเนนต์เดียวกัน)
 * เปิดได้โดยไม่ต้อง login — สำหรับฝังในแท็บทรัพยากรคลังของ TSL MIS
 * เมื่อกดลิงก์ไปหน้าอื่นในระบบ จะเข้าสู่ login ตามปกติของ Smart Asset
 */
export default function EmbedDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <AssetExecutiveDashboard />
    </div>
  );
}
