import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { ImportUploadForm } from "@/components/assets/import-upload-form";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeTH } from "@/lib/utils";

export default async function AssetImportPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: assetClass } = await searchParams;
  const defaultClass =
    assetClass === "LOW_VALUE" ? "LOW_VALUE" : "NORMAL";

  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      uploadedBy: { select: { fullName: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="นำเข้า Excel ทะเบียนครุภัณฑ์"
        description="อัปโหลด → Staging → ตรวจสอบ → Preview → ยืนยันนำเข้า"
      />

      <p className="text-sm text-slate-600">
        ต้องการ sync จากเครื่อง client อัตโนมัติ?{" "}
        <Link href="/assets/sync-agent" className="font-medium text-teal-800 hover:underline">
          ไปที่ Sync Agent (ดาวน์โหลดตัวติดตั้ง / ทดสอบการเชื่อมต่อ)
        </Link>
      </p>

      <ImportUploadForm defaultAssetClass={defaultClass} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          ประวัติการนำเข้าล่าสุด
        </h3>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  ไฟล์
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  ประเภท
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  สถานะ
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  แถว
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  เวลา
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  เปรียบเทียบ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    ยังไม่มีประวัติการนำเข้า
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-3">
                      <Link
                        href={`/assets/import/${b.id}`}
                        className="font-medium text-teal-800 hover:underline"
                      >
                        {b.fileName}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {b.uploadedBy?.fullName ?? "-"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="secondary">
                        {b.assetClass === "LOW_VALUE"
                          ? "ต่ำกว่าเกณฑ์"
                          : "ปกติ"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={
                          b.status === "COMMITTED"
                            ? "success"
                            : b.status === "FAILED"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <div>
                        ทั้งหมด {b.totalRows.toLocaleString("th-TH")} · นำเข้า{" "}
                        {b.committedRows.toLocaleString("th-TH")}
                      </div>
                      <div className="text-xs text-slate-500">
                        ผ่าน {b.validRows} · เตือน {b.warningRows} · ผิดพลาด{" "}
                        <span className={b.errorRows > 0 ? "font-semibold text-red-700" : ""}>
                          {b.errorRows}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {formatDateTimeTH(b.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/assets/import/${b.id}`}
                          className="text-sm text-teal-800 hover:underline"
                        >
                          ดูสรุป
                        </Link>
                        {b.errorRows > 0 ? (
                          <Link
                            href={`/assets/import/${b.id}?filter=not_imported`}
                            className="text-sm font-medium text-red-700 hover:underline"
                          >
                            ดูที่นำเข้าไม่ได้ ({b.errorRows})
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
