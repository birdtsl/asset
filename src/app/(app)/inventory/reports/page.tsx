import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function InventoryReportsPage() {
  const [balances, receiptAgg, issueAgg] = await Promise.all([
    prisma.stockBalance.findMany({
      include: {
        material: { include: { category: true, unit: true } },
        warehouse: true,
      },
      orderBy: [{ warehouseId: "asc" }, { materialId: "asc" }],
    }),
    prisma.stockReceipt.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.stockIssue.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const totalValue = balances.reduce(
    (sum, b) => sum + Number(b.quantity) * Number(b.avgCost),
    0,
  );
  const lowCount = balances.filter(
    (b) => Number(b.quantity) <= Number(b.material.reorderPoint),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="รายงานสต็อก"
        description="ยอดคงเหลือและสรุปเอกสารรับ-จ่าย"
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory">กลับคลัง</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">มูลค่าคงเหลือ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {totalValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">รายการใกล้จุดสั่งซื้อ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-700">
            {lowCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">เอกสาร</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-700">
            {receiptAgg.map((r) => (
              <div key={`rc-${r.status}`}>
                รับเข้า {r.status}: {r._count._all}
              </div>
            ))}
            {issueAgg.map((r) => (
              <div key={`is-${r.status}`}>
                จ่ายออก {r.status}: {r._count._all}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                คลัง
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                วัสดุ
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                คงเหลือ
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                ต้นทุนเฉลี่ย
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                มูลค่า
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {balances.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  ยังไม่มียอดคงเหลือ — เริ่มจากใบรับเข้า
                </td>
              </tr>
            ) : (
              balances.map((b) => {
                const qty = Number(b.quantity);
                const avg = Number(b.avgCost);
                const low = qty <= Number(b.material.reorderPoint);
                return (
                  <tr key={b.id}>
                    <td className="px-3 py-3">{b.warehouse.name}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{b.material.name}</div>
                      <div className="text-xs text-slate-500">
                        {b.material.code}
                        {b.material.category
                          ? ` · ${b.material.category.name}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {qty.toLocaleString("th-TH")} {b.material.unit?.name ?? ""}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {avg.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      {(qty * avg).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-3">
                      {low ? (
                        <Badge variant="warning">ใกล้จุดสั่งซื้อ</Badge>
                      ) : (
                        <Badge variant="success">ปกติ</Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
