import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTH } from "@/lib/utils";

export default async function MaintenancePage() {
  const rows = await prisma.maintenanceOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      asset: { select: { assetCode: true, itemName: true } },
      land: { select: { parcelNo: true, title: true } },
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="ซ่อมบำรุง"
        description="งานซ่อมบำรุงครุภัณฑ์และที่ดิน"
        actions={
          <Button asChild>
            <Link href="/maintenance/new">สร้างใบซ่อม</Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">เลขที่</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">เป้าหมาย</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">หัวข้อ</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">วันที่</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">ค่าใช้จ่าย</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  ยังไม่มีใบซ่อมบำรุง
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">
                    <Link href={`/maintenance/${row.id}`} className="font-medium text-teal-800 hover:underline">
                      {row.docNo}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {row.asset
                      ? `${row.asset.assetCode} · ${row.asset.itemName}`
                      : row.land
                        ? `${row.land.parcelNo} · ${row.land.title}`
                        : "-"}
                  </td>
                  <td className="px-3 py-3">{row.title}</td>
                  <td className="px-3 py-3">{formatDateTH(row.requestDate)}</td>
                  <td className="px-3 py-3 text-right">
                    {Number(row.cost).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
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
