import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { IssueForm } from "@/components/inventory/issue-form";

export default async function NewIssuePage() {
  const [warehouses, materials, departments, balances] = await Promise.all([
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.material.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.stockBalance.findMany(),
  ]);

  const onHandMap = new Map<string, number>();
  for (const b of balances) {
    const key = b.materialId;
    onHandMap.set(key, (onHandMap.get(key) || 0) + Number(b.quantity));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="สร้างใบจ่ายออก"
        description="ระบบจะตรวจสต็อกคงเหลือก่อนบันทึกและก่อนโพสต์"
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory/issues">กลับรายการ</Link>
          </Button>
        }
      />
      <IssueForm
        warehouses={warehouses.map((w) => ({
          id: w.id,
          label: `${w.code} — ${w.name}`,
        }))}
        materials={materials.map((m) => ({
          id: m.id,
          label: `${m.code} — ${m.name}`,
          onHand: onHandMap.get(m.id) || 0,
        }))}
        departments={departments.map((d) => ({
          id: d.id,
          label: `${d.code} — ${d.name}`,
        }))}
      />
    </div>
  );
}
