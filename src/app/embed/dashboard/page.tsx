import { AssetExecutiveDashboard } from "@/components/dashboard/asset-executive-dashboard";
import { EmbedLinkBridge } from "@/components/dashboard/embed-link-bridge";

export const dynamic = "force-dynamic";

/**
 * หน้า dashboard ชุดเดียวกับ /dashboard — ฝังใน iframe ของ TSL MIS ได้โดยไม่ต้องมี cookie
 * ถ้ามี mis_sso=token → คลิกรายละเอียดจะเปิดแท็บใหม่ผ่าน SSO (ไม่ต้องกรอกรหัส)
 */
export default async function EmbedDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mis_sso?: string }>;
}) {
  const sp = await searchParams;
  const ssoToken = sp.mis_sso?.trim() || "";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {ssoToken ? <EmbedLinkBridge ssoToken={ssoToken} /> : null}
      <AssetExecutiveDashboard />
    </div>
  );
}
