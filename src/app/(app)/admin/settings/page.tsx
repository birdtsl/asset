import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEnvSecurityReport } from "@/lib/security/env";
import {
  isHosxpAuthEnabled,
  isHosxpConfigured,
  queryHosxp,
} from "@/lib/hosxp/mysql";

export default async function SettingsPage() {
  const settings = await prisma.systemSetting.findMany({
    orderBy: [{ key: "asc" }],
  });

  let dbOk = false;
  let assetCount = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    assetCount = await prisma.asset.count();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const env = getEnvSecurityReport();
  const hosxpConfigured = isHosxpConfigured();
  const hosxpEnabled = isHosxpAuthEnabled();
  let hosxpOk = false;
  if (hosxpConfigured) {
    const ping = await queryHosxp("SELECT 1 AS ok");
    hosxpOk = !ping.error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่าระบบ"
        description="ค่าคอนฟิก สุขภาพระบบ และความปลอดภัย (Phase 7)"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Health Check</CardTitle>
            <CardDescription>สถานะรันไทม์</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Database</span>
              <Badge variant={dbOk ? "success" : "warning"}>
                {dbOk ? "OK" : "FAIL"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Assets in DB</span>
              <span className="font-medium">
                {assetCount.toLocaleString("th-TH")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Timezone</span>
              <span>{env.timezone}</span>
            </div>
            <div className="flex justify-between">
              <span>NODE_ENV</span>
              <span>{env.nodeEnv}</span>
            </div>
            <div className="flex justify-between">
              <span>Endpoint</span>
              <code className="text-xs">/api/health</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>ตรวจ env เบื้องต้น (ไม่แสดงค่า secret)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Env overall</span>
              <Badge variant={env.ok ? "success" : "warning"}>
                {env.ok ? "OK" : "NEEDS ATTENTION"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Missing required</span>
              <span>{env.missing.length ? env.missing.join(", ") : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Weak AUTH_SECRET</span>
              <Badge variant={env.weakSecret ? "warning" : "success"}>
                {env.weakSecret ? "YES" : "NO"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>OpenAI assistant</span>
              <span>{env.hasOpenAi ? "configured" : "FAQ/KPI mode"}</span>
            </div>
            <div className="flex justify-between">
              <span>Storage root</span>
              <span className="font-mono text-xs">{env.storageRoot}</span>
            </div>
            <div className="flex justify-between">
              <span>ERP/HOSxP login</span>
              <Badge
                variant={
                  hosxpConfigured && hosxpEnabled && hosxpOk
                    ? "success"
                    : "warning"
                }
              >
                {!hosxpConfigured
                  ? "NOT CONFIGURED"
                  : !hosxpEnabled
                    ? "DISABLED"
                    : hosxpOk
                      ? "READY"
                      : "DB ERROR"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>อ่านจากตาราง system_settings</CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <p className="text-sm text-slate-500">ยังไม่มีค่าตั้งค่า</p>
          ) : (
            <dl className="space-y-3">
              {settings.map((s) => (
                <div
                  key={s.id}
                  className="grid gap-1 border-b border-slate-100 pb-3 last:border-0 sm:grid-cols-3"
                >
                  <dt className="text-sm font-medium text-slate-700">
                    {s.label ?? s.key}
                  </dt>
                  <dd className="text-sm text-slate-500 sm:col-span-1">{s.key}</dd>
                  <dd className="text-sm text-slate-900 sm:text-right">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production ops</CardTitle>
          <CardDescription>ดูรายละเอียดใน DEPLOY.md</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            Backup:{" "}
            <code className="rounded bg-slate-100 px-1">
              powershell -File scripts/backup.ps1
            </code>
          </p>
          <p>
            Smoke:{" "}
            <code className="rounded bg-slate-100 px-1">npm run smoke</code>
          </p>
          <p>ห้าม DROP database / ห้ามลบทะเบียนจริง — ใช้ soft flag และเอกสารวงจรชีวิต</p>
        </CardContent>
      </Card>
    </div>
  );
}
