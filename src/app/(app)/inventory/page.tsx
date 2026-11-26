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
import { ArrowDownToLine, ArrowUpFromLine, Boxes, ClipboardList } from "lucide-react";

export default async function InventoryPage() {
  const [materialCount, balanceCount, lowStock, receipts, issues] =
    await Promise.all([
      prisma.material.count({ where: { isActive: true } }),
      prisma.stockBalance.count(),
      prisma.stockBalance.findMany({
        include: { material: true, warehouse: true },
        take: 200,
      }),
      prisma.stockReceipt.count({ where: { status: "DRAFT" } }),
      prisma.stockIssue.count({ where: { status: "DRAFT" } }),
    ]);

  const lowStockRows = lowStock.filter((b) => {
    const qty = Number(b.quantity);
    const reorder = Number(b.material.reorderPoint);
    return qty <= reorder;
  });

  const onHandValue = lowStock.reduce((sum, b) => {
    return sum + Number(b.quantity) * Number(b.avgCost);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="วัสดุคงคลัง"
        description="ยอดคงเหลือ / รับเข้า / จ่ายออก / Ledger"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/inventory/materials">รายการวัสดุ</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/inventory/receipts/new">
                <ArrowDownToLine className="h-4 w-4" />
                รับเข้า
              </Link>
            </Button>
            <Button asChild>
              <Link href="/inventory/issues/new">
                <ArrowUpFromLine className="h-4 w-4" />
                จ่ายออก
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">รายการวัสดุ</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold">{materialCount}</div>
            <Boxes className="h-5 w-5 text-teal-700" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">รายการคงคลัง</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{balanceCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">มูลค่าคงเหลือโดยประมาณ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {onHandValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">เอกสารรอโพสต์</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            รับเข้า {receipts} · จ่ายออก {issues}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory/receipts">ใบรับเข้า</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory/issues">ใบจ่ายออก</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory/ledger">
            <ClipboardList className="h-4 w-4" />
            Stock Ledger
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory/reports">รายงานสต็อก</Link>
        </Button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          วัสดุใกล้จุดสั่งซื้อ ({lowStockRows.length})
        </h3>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  วัสดุ
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  คลัง
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  คงเหลือ
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                  จุดสั่งซื้อ
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    ยังไม่มีรายการใกล้จุดสั่งซื้อ
                  </td>
                </tr>
              ) : (
                lowStockRows.slice(0, 20).map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-800">
                        {row.material.name}
                      </div>
                      <div className="text-xs text-slate-500">{row.material.code}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{row.warehouse.name}</td>
                    <td className="px-3 py-3 text-right font-medium">
                      {Number(row.quantity).toLocaleString("th-TH")}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {Number(row.material.reorderPoint).toLocaleString("th-TH")}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="warning">ต้องสั่งซื้อ</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
