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
import { formatDateTH, formatDateTimeTH } from "@/lib/utils";

export default async function DisposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.assetDisposal.findUnique({
    where: { id },
    include: {
      asset: true,
      createdBy: true,
      approvedBy: true,
    },
  });
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ใบจำหน่าย ${row.docNo}`}
        description={`${row.asset.assetCode} · ${row.asset.itemName}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/disposals">กลับรายการ</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={row.status === "COMPLETED" ? "success" : "secondary"}>
          {row.status}
        </Badge>
        {row.status !== "COMPLETED" && row.status !== "CANCELLED" ? (
          <ActionButton
            endpoint={`/api/disposals/${row.id}/complete`}
            label="ยืนยันจำหน่าย"
            confirmText="ยืนยันจำหน่ายครุภัณฑ์? รายการจะถูกปิดใช้งาน"
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายละเอียด</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>วันที่จำหน่าย: {formatDateTH(row.disposalDate)}</div>
          <div>วิธีการ: {row.method}</div>
          <div>
            มูลค่าอนุมัติ:{" "}
            {row.approvedValue
              ? Number(row.approvedValue).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })
              : "-"}
          </div>
          <div>สร้างโดย: {row.createdBy?.fullName ?? "-"}</div>
          <div className="sm:col-span-2">เหตุผล: {row.reason ?? "-"}</div>
          <div className="sm:col-span-2">หมายเหตุ: {row.notes ?? "-"}</div>
          <div>
            อนุมัติโดย: {row.approvedBy?.fullName ?? "-"}
            {row.completedAt ? ` · ${formatDateTimeTH(row.completedAt)}` : ""}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
