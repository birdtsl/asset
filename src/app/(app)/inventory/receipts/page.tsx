import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { DocStatusBadge } from "@/components/inventory/doc-status-badge";
import { formatDateTH } from "@/lib/utils";

export default async function ReceiptsPage() {
  const receipts = await prisma.stockReceipt.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      warehouse: true,
      supplier: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="ใบรับเข้าวัสดุ"
        description="เอกสารรับเข้าคลัง"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/inventory">กลับคลัง</Link>
            </Button>
            <Button asChild>
              <Link href="/inventory/receipts/new">สร้างใบรับเข้า</Link>
            </Button>
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                เลขที่
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                วันที่
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                คลัง
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ผู้จำหน่าย
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                รายการ
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                สถานะ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  ยังไม่มีใบรับเข้า
                </td>
              </tr>
            ) : (
              receipts.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-3">
                    <Link
                      href={`/inventory/receipts/${r.id}`}
                      className="font-medium text-teal-800 hover:underline"
                    >
                      {r.docNo}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{formatDateTH(r.receiptDate)}</td>
                  <td className="px-3 py-3">{r.warehouse.name}</td>
                  <td className="px-3 py-3">{r.supplier?.name ?? "-"}</td>
                  <td className="px-3 py-3">{r._count.items}</td>
                  <td className="px-3 py-3">
                    <DocStatusBadge status={r.status} />
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
