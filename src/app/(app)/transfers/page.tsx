import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTH } from "@/lib/utils";

export default async function TransfersPage() {
  const rows = await prisma.assetTransfer.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      asset: { select: { assetCode: true, itemName: true } },
      toDepartment: true,
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="โอนย้ายครุภัณฑ์"
        description="โอนสถานที่ตั้ง/หน่วยงานผู้รับผิดชอบ"
        actions={
          <Button asChild>
            <Link href="/transfers/new">สร้างใบโอนย้าย</Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">เลขที่</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">ครุภัณฑ์</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">จาก → ไป</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">วันที่</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">ยังไม่มีใบโอนย้าย</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">
                    <Link href={`/transfers/${row.id}`} className="font-medium text-teal-800 hover:underline">
                      {row.docNo}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {row.asset.assetCode}
                    <div className="text-xs text-slate-500">{row.asset.itemName}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <div>{row.fromLocationText ?? "-"}</div>
                    <div className="text-xs text-slate-500">→ {row.toLocationText}</div>
                  </td>
                  <td className="px-3 py-3">{formatDateTH(row.transferDate)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={row.status === "COMPLETED" ? "success" : "secondary"}>
                      {row.status}
                    </Badge>
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
