import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { DisposalForm } from "@/components/lifecycle/disposal-form";

export default async function NewDisposalPage() {
  const assets = await prisma.asset.findMany({
    where: { isActive: true },
    orderBy: { assetCode: "asc" },
    take: 300,
    select: { id: true, assetCode: true, itemName: true },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="สร้างใบจำหน่าย"
        description="เมื่อยืนยันจำหน่าย ครุภัณฑ์จะถูกปิดการใช้งาน"
        actions={
          <Button asChild variant="outline">
            <Link href="/disposals">กลับรายการ</Link>
          </Button>
        }
      />
      <DisposalForm
        assets={assets.map((a) => ({
          id: a.id,
          label: `${a.assetCode} — ${a.itemName}`,
        }))}
      />
    </div>
  );
}
