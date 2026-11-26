import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { MaintenanceForm } from "@/components/lifecycle/maintenance-form";

export default async function NewMaintenancePage() {
  const [assets, lands] = await Promise.all([
    prisma.asset.findMany({
      where: { isActive: true },
      orderBy: { assetCode: "asc" },
      take: 300,
      select: { id: true, assetCode: true, itemName: true },
    }),
    prisma.landParcel.findMany({
      where: { isActive: true },
      orderBy: { parcelNo: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="สร้างใบซ่อมบำรุง"
        actions={
          <Button asChild variant="outline">
            <Link href="/maintenance">กลับรายการ</Link>
          </Button>
        }
      />
      <MaintenanceForm
        assets={assets.map((a) => ({
          id: a.id,
          label: `${a.assetCode} — ${a.itemName}`,
        }))}
        lands={lands.map((l) => ({
          id: l.id,
          label: `${l.parcelNo} — ${l.title}`,
        }))}
      />
    </div>
  );
}
