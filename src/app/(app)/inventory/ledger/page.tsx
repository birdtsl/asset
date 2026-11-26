import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTH } from "@/lib/utils";

export default async function StockLedgerPage() {
  const rows = await prisma.stockLedger.findMany({
    orderBy: [{ movementDate: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      material: true,
      warehouse: true,
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Ledger"
        description="ความเคลื่อนไหวรับเข้า / จ่ายออก (100 รายการล่าสุด)"
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory">กลับคลัง</Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                วันที่
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                เอกสาร
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ประเภท
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                วัสดุ
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                จำนวน
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                คงเหลือหลังทำรายการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  ยังไม่มีความเคลื่อนไหวสต็อก
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">{formatDateTH(row.movementDate)}</td>
                  <td className="px-3 py-3 font-medium text-slate-800">
                    {row.refDocNo ?? "-"}
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={
                        row.movementType === "RECEIPT" ||
                        row.movementType === "ADJUST_IN"
                          ? "success"
                          : "warning"
                      }
                    >
                      {row.movementType}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div>{row.material.name}</div>
                    <div className="text-xs text-slate-500">
                      {row.warehouse.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-medium">
                    {Number(row.quantity).toLocaleString("th-TH")}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {Number(row.balanceAfter).toLocaleString("th-TH")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
