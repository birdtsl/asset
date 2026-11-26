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

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.assetTransfer.findUnique({
    where: { id },
    include: {
      asset: true,
      fromDepartment: true,
      toDepartment: true,
      createdBy: true,
      approvedBy: true,
    },
  });
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ใบโอนย้าย ${row.docNo}`}
        description={`${row.asset.assetCode} · ${row.asset.itemName}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/transfers">กลับรายการ</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={row.status === "COMPLETED" ? "success" : "secondary"}>
          {row.status}
        </Badge>
        {row.status !== "COMPLETED" && row.status !== "CANCELLED" ? (
          <ActionButton
            endpoint={`/api/transfers/${row.id}/complete`}
            label="ยืนยันโอนย้าย"
            confirmText="ยืนยันโอนย้ายและอัปเดตสถานที่ตั้งครุภัณฑ์?"
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายละเอียด</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>วันที่โอน: {formatDateTH(row.transferDate)}</div>
          <div>หน่วยงานต้นทาง: {row.fromDepartment?.name ?? "-"}</div>
          <div>หน่วยงานปลายทาง: {row.toDepartment?.name ?? "-"}</div>
          <div>สถานที่เดิม: {row.fromLocationText ?? "-"}</div>
          <div className="sm:col-span-2">สถานที่ใหม่: {row.toLocationText}</div>
          <div className="sm:col-span-2">เหตุผล: {row.reason ?? "-"}</div>
          <div>สร้างโดย: {row.createdBy?.fullName ?? "-"}</div>
          <div>
            อนุมัติโดย: {row.approvedBy?.fullName ?? "-"}
            {row.completedAt ? ` · ${formatDateTimeTH(row.completedAt)}` : ""}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
