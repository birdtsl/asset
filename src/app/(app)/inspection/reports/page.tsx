import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InspectionResultChart } from "@/components/inspection/result-chart";

export default async function InspectionReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ campaignId?: string }>;
}) {
  const { campaignId } = await searchParams;

  const campaigns = await prisma.inspectionCampaign.findMany({
    orderBy: [{ yearBe: "desc" }, { createdAt: "desc" }],
  });

  const selected =
    campaigns.find((c) => c.id === campaignId) || campaigns[0] || null;

  const summary = selected
    ? await prisma.inspectionItem.groupBy({
        by: ["result"],
        where: { campaignId: selected.id },
        _count: { _all: true },
      })
    : [];

  const byLocation = selected
    ? await prisma.$queryRaw<
        { location_text: string | null; total: bigint; pending: bigint }[]
      >`
        SELECT a.location_text,
               COUNT(*) AS total,
               SUM(CASE WHEN i.result = 'PENDING' THEN 1 ELSE 0 END) AS pending
        FROM inspection_items i
        INNER JOIN assets a ON a.id = i.asset_id
        WHERE i.campaign_id = ${selected.id}
        GROUP BY a.location_text
        ORDER BY total DESC
        LIMIT 15
      `
    : [];

  const chartData = summary.map((s) => ({
    name: s.result,
    value: s._count._all,
  }));

  const total = summary.reduce((n, s) => n + s._count._all, 0);
  const pending = summary.find((s) => s.result === "PENDING")?._count._all || 0;
  const pass = summary.find((s) => s.result === "PASS")?._count._all || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="รายงานการตรวจประจำปี"
        description="สรุปผลตามรอบตรวจ"
        actions={
          <Button asChild variant="outline">
            <Link href="/inspection">กลับหน้าตรวจ</Link>
          </Button>
        }
      />

      <form className="flex gap-2">
        <select
          name="campaignId"
          defaultValue={selected?.id || ""}
          className="h-10 min-w-[260px] rounded-md border border-slate-300 bg-white px-3 text-sm"
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.yearBe} · {c.title}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          แสดงรายงาน
        </Button>
      </form>

      {!selected ? (
        <p className="text-sm text-slate-500">ยังไม่มีรอบตรวจให้รายงาน</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600">รายการทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {total.toLocaleString("th-TH")}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600">ตรวจผ่าน</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-emerald-700">
                {pass.toLocaleString("th-TH")}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600">ค้างตรวจ</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-amber-700">
                {pending.toLocaleString("th-TH")}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>สัดส่วนผลการตรวจ</CardTitle>
            </CardHeader>
            <CardContent>
              <InspectionResultChart data={chartData} />
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    สถานที่ตั้ง
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    ทั้งหมด
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    ค้างตรวจ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byLocation.map((row, idx) => (
                  <tr key={`${row.location_text}-${idx}`}>
                    <td className="px-3 py-3">{row.location_text || "-"}</td>
                    <td className="px-3 py-3 text-right">
                      {Number(row.total).toLocaleString("th-TH")}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {Number(row.pending).toLocaleString("th-TH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
