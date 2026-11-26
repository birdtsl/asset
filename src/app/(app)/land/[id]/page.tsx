import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTH } from "@/lib/utils";
import { fixThaiMojibake } from "@/lib/text/thai-mojibake";

export default async function LandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const land = await prisma.landParcel.findUnique({
    where: { id },
    include: {
      maintenances: {
        orderBy: { requestDate: "desc" },
        take: 10,
      },
    },
  });
  if (!land) notFound();

  const parcelNo = fixThaiMojibake(land.parcelNo) ?? land.parcelNo;
  const title = fixThaiMojibake(land.title) ?? land.title;
  const plotNo = fixThaiMojibake(land.plotNo) ?? land.plotNo;
  const address = fixThaiMojibake(land.address) ?? land.address;
  const responsibleUnit =
    fixThaiMojibake(land.responsibleUnit) ?? land.responsibleUnit;
  const donorName = fixThaiMojibake(land.donorName) ?? land.donorName;
  const areaText = fixThaiMojibake(land.areaText) ?? land.areaText;
  const notes = fixThaiMojibake(land.notes) ?? land.notes;

  const fields = [
    ["เลขแปลง", parcelNo],
    ["ชื่อ", title],
    ["แปลงที่", plotNo ?? "-"],
    ["ที่ตั้ง", address ?? "-"],
    ["หน่วยงานรับผิดชอบ", responsibleUnit ?? "-"],
    ["โทรศัพท์", land.phone ?? "-"],
    ["ผู้บริจาค/ผู้ขาย", donorName ?? "-"],
    ["เนื้อที่", areaText ?? "-"],
    [
      "มูลค่าตามบัญชี",
      land.bookValue
        ? Number(land.bookValue).toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })
        : "-",
    ],
    ["วันที่ได้มา", formatDateTH(land.acquiredAt)],
    ["หมายเหตุ", notes ?? "-"],
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={parcelNo}
        description={title}
        actions={
          <Button asChild variant="outline">
            <Link href="/land">กลับรายการ</Link>
          </Button>
        }
      />

      <div className="flex gap-2">
        {land.hasBuildings ? (
          <Badge variant="secondary">มีสิ่งปลูกสร้าง</Badge>
        ) : (
          <Badge variant="outline">ที่ดินเปล่า</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดที่ดิน</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="border-b border-slate-100 pb-2">
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติซ่อมบำรุง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {land.maintenances.length === 0 ? (
            <p className="text-slate-500">ยังไม่มีประวัติ</p>
          ) : (
            land.maintenances.map((m) => (
              <div key={m.id} className="flex justify-between border-b border-slate-100 pb-2">
                <div>
                  <Link href={`/maintenance/${m.id}`} className="text-teal-800 hover:underline">
                    {m.docNo}
                  </Link>
                  <div className="text-slate-600">{m.title}</div>
                </div>
                <div className="text-right text-slate-500">
                  {formatDateTH(m.requestDate)}
                  <div>{m.status}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
