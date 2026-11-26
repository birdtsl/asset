import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTH } from "@/lib/utils";
import { fixThaiMojibake } from "@/lib/text/thai-mojibake";

export default async function LandPage() {
  const lands = await prisma.landParcel.findMany({
    where: { isActive: true },
    orderBy: { parcelNo: "asc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="ทะเบียนที่ดิน"
        description="ที่ราชพัสดุ โรงพยาบาลทุ่งเสลี่ยม"
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                แปลง
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ที่ตั้ง
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                พื้นที่
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
            {lands.map((land) => {
              const parcelNo = fixThaiMojibake(land.parcelNo) ?? land.parcelNo;
              const title = fixThaiMojibake(land.title) ?? land.title;
              const address = fixThaiMojibake(land.address) ?? land.address;
              const responsibleUnit =
                fixThaiMojibake(land.responsibleUnit) ?? land.responsibleUnit;
              const areaText = fixThaiMojibake(land.areaText) ?? land.areaText;
              return (
              <tr key={land.id}>
                <td className="px-3 py-3">
                  <Link
                    href={`/land/${land.id}`}
                    className="font-medium text-teal-800 hover:underline"
                  >
                    {parcelNo}
                  </Link>
                  <div className="text-xs text-slate-500">{title}</div>
                </td>
                <td className="px-3 py-3 text-slate-700">
                  <div>{address ?? "-"}</div>
                  <div className="text-xs text-slate-500">
                    {responsibleUnit ?? ""}
                  </div>
                </td>
                <td className="px-3 py-3">{areaText ?? "-"}</td>
                <td className="px-3 py-3 text-right">
                  {land.bookValue
                    ? Number(land.bookValue).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })
                    : "-"}
                </td>
                <td className="px-3 py-3">
                  {land.hasBuildings ? (
                    <Badge variant="secondary">มีสิ่งปลูกสร้าง</Badge>
                  ) : (
                    <Badge variant="outline">ที่ดินเปล่า</Badge>
                  )}
                  <div className="mt-1 text-xs text-slate-500">
                    {formatDateTH(land.acquiredAt)}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button asChild variant="outline">
        <Link href="/maintenance/new">แจ้งซ่อมบำรุงที่ดิน/ครุภัณฑ์</Link>
      </Button>
    </div>
  );
}
