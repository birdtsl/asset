import Link from "next/link";
import { PageHeader } from "@/components/master/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listNotifications } from "@/lib/notifications/notification-service";
import { formatDateTimeTH } from "@/lib/utils";

export default async function NotificationsPage() {
  const items = await listNotifications(100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="การแจ้งเตือน"
        description="แจ้งเตือนจากสถานะดำเนินงานจริงในระบบ"
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard">กลับแดชบอร์ด</Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                หัวข้อ
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ระดับ
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                หมวด
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                เวลา
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                  ยังไม่มีการแจ้งเตือน
                </td>
              </tr>
            ) : (
              items.map((n) => (
                <tr key={n.id} className={n.isRead ? "" : "bg-teal-50/30"}>
                  <td className="px-3 py-3">
                    {n.href ? (
                      <Link
                        href={n.href}
                        className="font-medium text-teal-800 hover:underline"
                      >
                        {n.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{n.title}</span>
                    )}
                    <p className="text-xs text-slate-500">{n.message}</p>
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={
                        n.severity === "CRITICAL" || n.severity === "WARNING"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {n.severity}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">{n.category}</td>
                  <td className="px-3 py-3 text-slate-500">
                    {formatDateTimeTH(n.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
