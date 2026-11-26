import Link from "next/link";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import {
  getAssetReportByCategory,
  getAssetReportByLocation,
} from "@/lib/reports/executive-kpis";

export default async function AssetReportsPage() {
  const [byCategory, byLocation] = await Promise.all([
    getAssetReportByCategory(),
    getAssetReportByLocation(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="รายงานครุภัณฑ์"
        description="สรุปจำนวนตามประเภทและสถานที่ตั้ง (ข้อมูลจริง)"
        actions={
          <Button asChild variant="outline">
            <Link href="/reports">กลับศูนย์รายงาน</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            ตามประเภท / ชั้นทรัพย์สิน
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  ประเภท
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  ชั้น
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">
                  จำนวน
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byCategory.map((row, i) => (
                <tr key={`${row.categoryName}-${row.assetClass}-${i}`}>
                  <td className="px-3 py-2">{row.categoryName || "-"}</td>
                  <td className="px-3 py-2">
                    {row.assetClass === "LOW_VALUE" ? "ต่ำกว่าเกณฑ์" : "ปกติ"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row._count._all.toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            ตามสถานที่ตั้ง (Top 20)
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  สถานที่
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">
                  จำนวน
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byLocation.map((row, i) => (
                <tr key={`${row.locationText}-${i}`}>
                  <td className="px-3 py-2">{row.locationText || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {row._count._all.toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
