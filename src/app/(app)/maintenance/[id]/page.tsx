import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/lifecycle/action-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTH } from "@/lib/utils";

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.maintenanceOrder.findUnique({
    where: { id },
    include: {
      asset: true,
      land: true,
      createdBy: true,
    },
  });
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ใบซ่อม ${row.docNo}`}
        description={row.title}
        actions={
          <Button asChild variant="outline">
            <Link href="/maintenance">กลับรายการ</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={row.status === "COMPLETED" ? "success" : "secondary"}>
          {row.status}
        </Badge>
        {row.status !== "COMPLETED" && row.status !== "CANCELLED" ? (
          <ActionButton
            endpoint={`/api/maintenance/${row.id}/complete`}
            label="ปิดงานซ่อมบำรุง"
            confirmText="ยืนยันปิดงานซ่อมบำรุง?"
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายละเอียด</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            เป้าหมาย:{" "}
            {row.asset
              ? `${row.asset.assetCode} · ${row.asset.itemName}`
              : row.land
                ? `${row.land.parcelNo} · ${row.land.title}`
                : "-"}
          </div>
          <div>วันที่แจ้ง: {formatDateTH(row.requestDate)}</div>
          <div>วันที่เสร็จ: {formatDateTH(row.completedDate)}</div>
          <div>
            ค่าใช้จ่าย:{" "}
            {Number(row.cost).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </div>
          <div>ผู้รับจ้าง: {row.vendorName ?? "-"}</div>
          <div>ผู้แจ้ง: {row.requestedBy ?? "-"}</div>
          <div className="sm:col-span-2">รายละเอียด: {row.description ?? "-"}</div>
          <div className="sm:col-span-2">หมายเหตุ: {row.notes ?? "-"}</div>
        </CardContent>
      </Card>
    </div>
  );
}
