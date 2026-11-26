import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrBatchButton } from "@/components/inspection/qr-batch-button";
import { formatDateTH } from "@/lib/utils";

export default async function InspectionPage() {
  const [campaigns, qrReady, qrMissing] = await Promise.all([
    prisma.inspectionCampaign.findMany({
      orderBy: [{ yearBe: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { items: true } },
        createdBy: { select: { fullName: true } },
      },
    }),
    prisma.asset.count({ where: { isActive: true, qrToken: { not: null } } }),
    prisma.asset.count({ where: { isActive: true, qrToken: null } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ตรวจประจำปี / QR Code"
        description="สร้างรอบตรวจ บันทึกผล และออก QR สำหรับสแกน"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/inspection/reports">รายงานการตรวจ</Link>
            </Button>
            <Button asChild>
              <Link href="/inspection/new">สร้างรอบตรวจ</Link>
            </Button>
          </div>
        }
      />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          QR พร้อมใช้ {qrReady.toLocaleString("th-TH")} · ยังไม่มี{" "}
          {qrMissing.toLocaleString("th-TH")}
        </p>
        <div className="mt-3">
          <QrBatchButton />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                รอบตรวจ
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ปี พ.ศ.
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ช่วงเวลา
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
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  ยังไม่มีรอบตรวจประจำปี
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-3">
                    <Link
                      href={`/inspection/${c.id}`}
                      className="font-medium text-teal-800 hover:underline"
                    >
                      {c.title}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {c.createdBy?.fullName ?? "-"}
                    </div>
                  </td>
                  <td className="px-3 py-3">{c.yearBe}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatDateTH(c.startDate)}
                    {c.endDate ? ` - ${formatDateTH(c.endDate)}` : ""}
                  </td>
                  <td className="px-3 py-3">{c._count.items.toLocaleString("th-TH")}</td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={
                        c.status === "CLOSED"
                          ? "secondary"
                          : c.status === "IN_PROGRESS"
                            ? "success"
                            : "outline"
                      }
                    >
                      {c.status}
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
