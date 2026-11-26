import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { TransferForm } from "@/components/lifecycle/transfer-form";

export default async function NewTransferPage() {
  const [assets, departments] = await Promise.all([
    prisma.asset.findMany({
      where: { isActive: true },
      orderBy: { assetCode: "asc" },
      take: 300,
      select: { id: true, assetCode: true, itemName: true, locationText: true },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="สร้างใบโอนย้าย"
        actions={
          <Button asChild variant="outline">
            <Link href="/transfers">กลับรายการ</Link>
          </Button>
        }
      />
      <TransferForm
        assets={assets.map((a) => ({
          id: a.id,
          label: `${a.assetCode} — ${a.itemName}${a.locationText ? ` (${a.locationText})` : ""}`,
        }))}
        departments={departments.map((d) => ({
          id: d.id,
          label: `${d.code} — ${d.name}`,
        }))}
      />
    </div>
  );
}
