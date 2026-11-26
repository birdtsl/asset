import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { formatDateTimeTH } from "@/lib/utils";

export default async function AuditReportPage() {
  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { fullName: true, username: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="บันทึกกิจกรรม (Audit)"
        description="100 รายการล่าสุดจาก audit_logs"
        actions={
          <Button asChild variant="outline">
            <Link href="/reports">กลับศูนย์รายงาน</Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                เวลา
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ผู้ใช้
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                การกระทำ
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                รายละเอียด
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                  {formatDateTimeTH(log.createdAt)}
                </td>
                <td className="px-3 py-2">
                  {log.user?.fullName ?? log.user?.username ?? "ระบบ"}
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium">{log.action}</span>
                  <span className="text-slate-500"> · {log.entity}</span>
                </td>
                <td className="max-w-md truncate px-3 py-2 text-slate-600">
                  {log.detail || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
