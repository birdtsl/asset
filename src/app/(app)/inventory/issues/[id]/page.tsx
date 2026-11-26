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

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await prisma.stockIssue.findUnique({
    where: { id },
    include: {
      warehouse: true,
      department: true,
      createdBy: true,
      postedBy: true,
      items: { include: { material: { include: { unit: true } } } },
    },
  });
  if (!issue) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ใบจ่ายออก ${issue.docNo}`}
        description={issue.warehouse.name}
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory/issues">กลับรายการ</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <DocStatusBadge status={issue.status} />
        {issue.status === "DRAFT" ? (
          <PostButton
            endpoint={`/api/inventory/issues/${issue.id}/post`}
            label="โพสต์จ่ายออกจากคลัง"
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายละเอียดเอกสาร</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>วันที่จ่ายออก: {formatDateTH(issue.issueDate)}</div>
          <div>หน่วยงาน: {issue.department?.name ?? "-"}</div>
          <div>ผู้ขอเบิก: {issue.requestedBy ?? "-"}</div>
          <div>วัตถุประสงค์: {issue.purpose ?? "-"}</div>
          <div>สร้างโดย: {issue.createdBy?.fullName ?? "-"}</div>
          <div>
            โพสต์โดย: {issue.postedBy?.fullName ?? "-"}
            {issue.postedAt ? ` · ${formatDateTimeTH(issue.postedAt)}` : ""}
          </div>
          <div className="sm:col-span-2">หมายเหตุ: {issue.notes ?? "-"}</div>
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
                ต้นทุน/หน่วย
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                รวม
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issue.items.map((item) => (
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
