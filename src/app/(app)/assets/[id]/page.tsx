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
import { AssetQrPanel } from "@/components/inspection/asset-qr-panel";
import { buildAssetQrUrl } from "@/lib/inspection/qr";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: { status: true, sourceBatch: true, location: true },
  });
  if (!asset) notFound();

  const qrUrl = asset.qrToken ? buildAssetQrUrl(asset.qrToken) : null;

  const fields = [
    ["รหัสครุภัณฑ์", asset.assetCode],
    ["กำหนดรหัสครุภัณฑ์", asset.typeCode ?? "-"],
    ["ลำดับที่ได้มา", asset.acquireSeq ?? "-"],
    ["ประเภท", asset.categoryName ?? "-"],
    ["ชนิด/รายการ", asset.itemName],
    ["อายุการใช้งาน (ปี)", asset.usefulLifeYears?.toString() ?? "-"],
    ["ประเภทเงิน", asset.budgetType ?? "-"],
    ["วิธีการได้มา", asset.acquireMethod ?? "-"],
    ["รุ่น/แบบ/ยี่ห้อ", asset.brandModel ?? "-"],
    [
      "สถานที่ตั้ง/ผู้รับผิดชอบ",
      asset.location?.name ||
        (asset.locationText && !/^\d+$/.test(asset.locationText)
          ? asset.locationText
          : null) ||
        "-",
    ],
    ["เอกสาร", asset.documentRef ?? "-"],
    ["ชำรุด", asset.checkDamaged ? "✓" : "-"],
    ["เสื่อมสภาพ", asset.checkDeteriorated ? "✓" : "-"],
    ["สูญไป", asset.checkLost ? "✓" : "-"],
    ["ไม่ใช้", asset.checkUnused ? "✓" : "-"],
    ["ใช้อยู่", asset.checkInUse ? "✓" : "-"],
    ["หมายเหตุการตรวจ", asset.checkRemark ?? "-"],
    [
      "วันที่ได้รับ",
      asset.receivedAt
        ? formatDateTH(asset.receivedAt)
        : [asset.receiveDay, asset.receiveMonth, asset.receiveYearBe]
            .filter((v) => v != null && String(v).trim() !== "")
            .join(" ") || "-",
    ],
    [
      "จำนวน",
      `${Number(asset.quantity.toString()).toLocaleString("th-TH")} ${asset.unitName ?? ""}`.trim(),
    ],
    [
      "ราคาต่อหน่วย",
      asset.unitPrice
        ? Number(asset.unitPrice.toString()).toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })
        : "-",
    ],
    [
      "มูลค่ารวม",
      asset.totalValue
        ? Number(asset.totalValue.toString()).toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          })
        : "-",
    ],
    [
      "คำนวณค่าเสื่อม",
      asset.calculateDepreciation ? "คำนวณ" : "ไม่คำนวณ",
    ],
    ["ผู้ขาย/บริจาค", asset.vendorName ?? "-"],
    ["ที่อยู่ผู้ขาย", asset.vendorAddress ?? "-"],
    ["โทรศัพท์", asset.vendorPhone ?? "-"],
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={asset.itemName}
        description={asset.assetCode}
        actions={
          <Button asChild variant="outline">
            <Link
              href={
                asset.assetClass === "LOW_VALUE"
                  ? "/assets/low-value"
                  : "/assets"
              }
            >
              กลับรายการ
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {asset.assetClass === "LOW_VALUE" ? "ต่ำกว่าเกณฑ์" : "ครุภัณฑ์ปกติ"}
        </Badge>
        <Badge variant="success">{asset.status?.name ?? "ใช้งาน"}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>รายละเอียดครุภัณฑ์</CardTitle>
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
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetQrPanel assetId={asset.id} initialUrl={qrUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
