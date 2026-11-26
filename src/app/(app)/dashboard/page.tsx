import { auth } from "@/lib/auth";
import { AssetExecutiveDashboard } from "@/components/dashboard/asset-executive-dashboard";

export default async function DashboardPage() {
  const session = await auth();
  return (
    <AssetExecutiveDashboard viewerName={session?.user.name ?? session?.user.username} />
  );
}
