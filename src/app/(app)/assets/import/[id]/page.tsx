import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { ImportActions } from "@/components/assets/import-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTimeTH } from "@/lib/utils";
import { fixThaiMojibake, parseThaiJsonList } from "@/lib/text/thai-mojibake";
import type { ImportRowStatus, Prisma } from "@prisma/client";

type FilterKey =
  | "all"
  | "imported"
  | "not_imported"
  | "WARNING"
  | "ERROR"
  | "VALID"
  | "COMMITTED"
  | "SKIPPED"
  | "PENDING";

function buildWhere(
  batchId: string,
  filter: FilterKey,
): Prisma.ImportStagingRowWhereInput {
  if (filter === "imported") {
    return { batchId, status: "COMMITTED" };
  }
  if (filter === "not_imported") {
    return {
      batchId,
      OR: [
        { status: "ERROR" },
        { status: "SKIPPED" },
        { commitAction: "SKIP" },
      ],
    };
  }
  if (filter === "all") return { batchId };
  return { batchId, status: filter as ImportRowStatus };
}

function resultLabel(row: {
  status: string;
  commitAction: string | null;
}) {
  if (row.status === "COMMITTED") {
    if (row.commitAction === "UPDATE") return { text: "นำเข้าแล้ว (อัปเดต)", ok: true };
    if (row.commitAction === "CREATE") return { text: "นำเข้าแล้ว (สร้างใหม่)", ok: true };
    return { text: "นำเข้าแล้ว", ok: true };
  }
  if (row.status === "ERROR" || row.commitAction === "SKIP" || row.status === "SKIPPED") {
    return { text: "ไม่ได้นำเข้า", ok: false };
  }
  if (row.status === "WARNING") return { text: "ผ่านแบบมีคำเตือน (รอ/พร้อม commit)", ok: true };
  if (row.status === "VALID") return { text: "ผ่าน (รอ/พร้อม commit)", ok: true };
  return { text: row.status, ok: false };
}

export default async function ImportBatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filter = (sp.filter as FilterKey) || "all";
  const page = Math.max(1, Number(sp.page || 1));
  const pageSize = 50;

  const batch = await prisma.importBatch.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { fullName: true, username: true } },
    },
  });
  if (!batch) notFound();

  const where = buildWhere(id, filter);

  const [rows, filteredTotal, statusGroups, actionGroups, errorRows] =
    await Promise.all([
      prisma.importStagingRow.findMany({
        where,
        orderBy: { rowNo: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.importStagingRow.count({ where }),
      prisma.importStagingRow.groupBy({
        by: ["status"],
        where: { batchId: id },
        _count: { _all: true },
      }),
      prisma.importStagingRow.groupBy({
        by: ["commitAction"],
        where: { batchId: id },
        _count: { _all: true },
      }),
      prisma.importStagingRow.findMany({
        where: { batchId: id, status: "ERROR" },
        select: { validationErrors: true },
      }),
    ]);

  const statusCount = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all]),
  ) as Record<string, number>;
  const actionCount = Object.fromEntries(
    actionGroups.map((g) => [String(g.commitAction), g._count._all]),
  ) as Record<string, number>;

  const reasonCount = new Map<string, number>();
  for (const row of errorRows) {
    for (const msg of parseThaiJsonList(row.validationErrors)) {
      const key = msg.startsWith("รหัสซ้ำในไฟล์นำเข้า:")
        ? "รหัสซ้ำในไฟล์นำเข้า"
        : msg;
      reasonCount.set(key, (reasonCount.get(key) || 0) + 1);
    }
  }

  const notImported = Math.max(
    (statusCount.ERROR || 0) + (statusCount.SKIPPED || 0),
    actionCount.SKIP || 0,
  );
  const imported = statusCount.COMMITTED || batch.committedRows || 0;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

  const canCommit =
    (batch.status === "VALIDATED" || batch.status === "FAILED") &&
    batch.validRows + batch.warningRows > 0;

  const filters: { key: FilterKey; label: string; count?: number }[] = [
    { key: "all", label: "ทั้งหมด", count: batch.totalRows },
    { key: "imported", label: "นำเข้าแล้ว", count: imported },
    { key: "not_imported", label: "ไม่ได้นำเข้า", count: notImported },
    { key: "ERROR", label: "ERROR", count: statusCount.ERROR || 0 },
    { key: "WARNING", label: "WARNING", count: statusCount.WARNING || batch.warningRows },
    { key: "VALID", label: "VALID", count: statusCount.VALID || batch.validRows },
    { key: "COMMITTED", label: "COMMITTED", count: statusCount.COMMITTED || 0 },
  ];

  function hrefFor(next: { filter?: FilterKey; page?: number }) {
    const f = next.filter ?? filter;
    const p = next.page ?? 1;
    const q = new URLSearchParams();
    if (f !== "all") q.set("filter", f);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/assets/import/${id}?${s}` : `/assets/import/${id}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="เปรียบเทียบผลการนำเข้า"
        description={batch.fileName}
        actions={
          <Button asChild variant="outline">
            <Link href="/assets/import">กลับรายการนำเข้า</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">ในไฟล์ Excel</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {batch.totalRows.toLocaleString("th-TH")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">นำเข้าสำเร็จ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-700">
            {imported.toLocaleString("th-TH")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">ไม่ได้นำเข้า</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-700">
            {notImported.toLocaleString("th-TH")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">ผ่าน / เตือน</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-700">
            {batch.validRows.toLocaleString("th-TH")} /{" "}
            {batch.warningRows.toLocaleString("th-TH")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">ผิดพลาด</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-700">
            {batch.errorRows.toLocaleString("th-TH")}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>สรุปเปรียบเทียบ Excel ↔ ระบบ</CardTitle>
            <CardDescription>
              ชีต {batch.sheetName} ·{" "}
              {batch.assetClass === "LOW_VALUE" ? "ต่ำกว่าเกณฑ์" : "ครุภัณฑ์ปกติ"} ·{" "}
              {batch.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>สร้างใหม่ (CREATE)</span>
              <span className="font-medium">
                {(actionCount.CREATE || 0).toLocaleString("th-TH")}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>อัปเดตของเดิม (UPDATE)</span>
              <span className="font-medium">
                {(actionCount.UPDATE || 0).toLocaleString("th-TH")}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span>ข้าม / ไม่นำเข้า (SKIP)</span>
              <span className="font-medium text-red-700">
                {(actionCount.SKIP || 0).toLocaleString("th-TH")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>อัปโหลดโดย</span>
              <span>
                {batch.uploadedBy?.fullName ?? "-"} ·{" "}
                {formatDateTimeTH(batch.createdAt)}
              </span>
            </div>
            <ImportActions
              batchId={batch.id}
              status={batch.status}
              canCommit={canCommit}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เหตุผลที่นำเข้าไม่ได้</CardTitle>
            <CardDescription>
              รวมจากแถวสถานะ ERROR ({(statusCount.ERROR || 0).toLocaleString("th-TH")} แถว)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reasonCount.size === 0 ? (
              <p className="text-sm text-slate-500">ไม่มีแถวที่นำเข้าไม่ได้</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {[...reasonCount.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([reason, count]) => (
                    <li
                      key={reason}
                      className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2"
                    >
                      <span className="text-slate-700">{reason}</span>
                      <Badge variant="warning">{count}</Badge>
                    </li>
                  ))}
              </ul>
            )}
            {(statusCount.ERROR || 0) > 0 ? (
              <div className="mt-4">
                <Button asChild size="sm" variant="outline">
                  <Link href={hrefFor({ filter: "not_imported", page: 1 })}>
                    ดูรายการที่ไม่ได้นำเข้าทั้งหมด
                  </Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            asChild
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
          >
            <Link href={hrefFor({ filter: f.key, page: 1 })}>
              {f.label}
              {typeof f.count === "number" ? ` (${f.count})` : ""}
            </Link>
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            ตารางเปรียบเทียบรายแถว
          </p>
          <p className="text-xs text-slate-500">
            แสดง {filteredTotal.toLocaleString("th-TH")} รายการ · หน้า {page}/
            {totalPages}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  แถว Excel
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  ข้อมูลจากไฟล์
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  ผลการนำเข้า
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  เหตุผล / คำเตือน
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                    ไม่พบรายการตามตัวกรองนี้
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const errors = parseThaiJsonList(row.validationErrors);
                  const warnings = parseThaiJsonList(row.validationWarnings);
                  const result = resultLabel(row);
                  const assetCode =
                    fixThaiMojibake(row.assetCode) ?? row.assetCode;
                  const itemName =
                    fixThaiMojibake(row.itemName) ?? row.itemName;
                  const categoryName =
                    fixThaiMojibake(row.categoryName) ?? row.categoryName;
                  const locationText =
                    fixThaiMojibake(row.locationText) ?? row.locationText;
                  return (
                    <tr
                      key={row.id}
                      className={result.ok ? undefined : "bg-red-50/40"}
                    >
                      <td className="px-3 py-3 align-top text-slate-500">
                        {row.rowNo}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <p className="font-medium text-slate-900">
                          {assetCode || (
                            <span className="text-red-600">ไม่มีรหัส</span>
                          )}
                        </p>
                        <p className="text-slate-700">{itemName || "-"}</p>
                        <p className="text-xs text-slate-500">
                          {[categoryName, locationText]
                            .filter(Boolean)
                            .join(" · ") || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          ราคา{" "}
                          {row.unitPrice
                            ? Number(row.unitPrice).toLocaleString("th-TH", {
                                minimumFractionDigits: 2,
                              })
                            : "-"}
                          {row.quantity != null
                            ? ` · จำนวน ${Number(row.quantity)}`
                            : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Badge
                          variant={
                            result.ok
                              ? row.status === "WARNING"
                                ? "warning"
                                : "success"
                              : "warning"
                          }
                        >
                          {row.status}
                          {row.commitAction ? ` / ${row.commitAction}` : ""}
                        </Badge>
                        <p
                          className={`mt-2 text-xs ${
                            result.ok ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {result.text}
                        </p>
                        {row.matchedAssetId ? (
                          <Link
                            href={`/assets/${row.matchedAssetId}`}
                            className="mt-1 inline-block text-xs text-teal-700 hover:underline"
                          >
                            เปิดครุภัณฑ์ในระบบ
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 align-top text-xs">
                        {errors.map((e) => (
                          <p key={e} className="text-red-700">
                            {e}
                          </p>
                        ))}
                        {warnings.map((w) => (
                          <p key={w} className="text-amber-700">
                            {w}
                          </p>
                        ))}
                        {errors.length === 0 && warnings.length === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <Button
              asChild
              size="sm"
              variant="outline"
              disabled={page <= 1}
            >
              <Link href={hrefFor({ page: Math.max(1, page - 1) })}>ก่อนหน้า</Link>
            </Button>
            <span className="text-xs text-slate-500">
              หน้า {page} จาก {totalPages}
            </span>
            <Button
              asChild
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
            >
              <Link href={hrefFor({ page: Math.min(totalPages, page + 1) })}>
                ถัดไป
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
