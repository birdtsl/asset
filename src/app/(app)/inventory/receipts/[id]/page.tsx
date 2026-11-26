import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { DocStatusBadge } from "@/components/inventory/doc-status-badge";
import { PostButton } from "@/components/inventory/post-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTH, formatDateTimeTH } from "@/lib/utils";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receipt = await prisma.stockReceipt.findUnique({
    where: { id },
    include: {
      warehouse: true,
      supplier: true,
      department: true,
      createdBy: true,
      postedBy: true,
      items: { include: { material: { include: { unit: true } } } },
    },
  });
  if (!receipt) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ใบรับเข้า ${receipt.docNo}`}
        description={receipt.warehouse.name}
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory/receipts">กลับรายการ</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <DocStatusBadge status={receipt.status} />
        {receipt.status === "DRAFT" ? (
          <PostButton
            endpoint={`/api/inventory/receipts/${receipt.id}/post`}
            label="โพสต์รับเข้าคลัง"
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดเอกสาร</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>วันที่รับเข้า: {formatDateTH(receipt.receiptDate)}</div>
          <div>ผู้จำหน่าย: {receipt.supplier?.name ?? "-"}</div>
          <div>หน่วยงาน: {receipt.department?.name ?? "-"}</div>
          <div>เลขที่อ้างอิง: {receipt.refNo ?? "-"}</div>
          <div>สร้างโดย: {receipt.createdBy?.fullName ?? "-"}</div>
          <div>
            โพสต์โดย: {receipt.postedBy?.fullName ?? "-"}
            {receipt.postedAt ? ` · ${formatDateTimeTH(receipt.postedAt)}` : ""}
          </div>
          <div className="sm:col-span-2">หมายเหตุ: {receipt.notes ?? "-"}</div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                วัสดุ
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                จำนวน
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                ราคา/หน่วย
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                รวม
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipt.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3">
                  <div className="font-medium">{item.material.name}</div>
                  <div className="text-xs text-slate-500">{item.material.code}</div>
                </td>
                <td className="px-3 py-3 text-right">
                  {Number(item.quantity).toLocaleString("th-TH")}{" "}
                  {item.material.unit?.name ?? ""}
                </td>
                <td className="px-3 py-3 text-right">
                  {Number(item.unitCost).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-3 text-right font-medium">
                  {Number(item.lineTotal).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
