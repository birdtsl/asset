import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { ReceiptForm } from "@/components/inventory/receipt-form";

export default async function NewReceiptPage() {
  const [warehouses, materials, suppliers, departments] = await Promise.all([
    prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.material.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="สร้างใบรับเข้า"
        description="บันทึกเป็น DRAFT ก่อน แล้วค่อยโพสต์เพื่ออัปเดตสต็อก"
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory/receipts">กลับรายการ</Link>
          </Button>
        }
      />
      <ReceiptForm
        warehouses={warehouses.map((w) => ({
          id: w.id,
          label: `${w.code} — ${w.name}`,
        }))}
        materials={materials.map((m) => ({
          id: m.id,
          label: `${m.code} — ${m.name}`,
        }))}
        suppliers={suppliers.map((s) => ({
          id: s.id,
          label: `${s.code} — ${s.name}`,
        }))}
        departments={departments.map((d) => ({
          id: d.id,
          label: `${d.code} — ${d.name}`,
        }))}
      />
    </div>
  );
}
