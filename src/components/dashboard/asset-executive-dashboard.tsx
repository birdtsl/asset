import Link from "next/link";
import { getAssetExecutiveSummary } from "@/lib/reports/asset-executive";
import { getExecutiveKpis } from "@/lib/reports/executive-kpis";
import { RegistryPanel } from "@/components/dashboard/registry-panel";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeTH } from "@/lib/utils";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  LandPlot,
  Package,
  PackageMinus,
  ShieldCheck,
  Wrench,
} from "lucide-react";

function money(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("th-TH", {
      maximumFractionDigits: 2,
    })} ล้าน`;
  }
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function AssetExecutiveDashboard({
  viewerName,
  publicMode = false,
}: {
  viewerName?: string | null;
  /** โหมดฝังใน MIS — ไม่บังคับ login, ลิงก์ไปหน้าอื่นเปิดแท็บใหม่ */
  publicMode?: boolean;
}) {
  const [summary, kpis] = await Promise.all([
    getAssetExecutiveSummary(),
    getExecutiveKpis(),
  ]);

  const attentionShare =
    summary.totalAssets > 0
      ? Math.round((summary.attentionCount / summary.totalAssets) * 100)
      : 0;

  const linkProps = publicMode
    ? ({ target: "_blank", rel: "noopener noreferrer" } as const)
    : {};

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-950 via-teal-800 to-teal-600 px-6 py-7 text-white shadow-lg">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-300/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100/80">
              TSL Smart Asset · ผู้บริหาร
              {publicMode ? " · โหมดสาธารณะ" : ""}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              สรุปทะเบียนครุภัณฑ์
            </h2>
            <p className="mt-2 max-w-xl text-sm text-teal-50/85">
              {viewerName ? `สวัสดี ${viewerName} — ` : null}
              ภาพรวมครุภัณฑ์ปกติและต่ำกว่าเกณฑ์ จากข้อมูลจริง ณ{" "}
              {formatDateTimeTH(summary.generatedAt)}
            </p>
          </div>
          {!publicMode ? (
            <div className="flex gap-2">
              <Link
                href="/assets"
                className="rounded-md bg-white/15 px-3 py-2 text-sm backdrop-blur hover:bg-white/25"
              >
                ครุภัณฑ์ปกติ
              </Link>
              <Link
                href="/assets/low-value"
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-teal-900 hover:bg-teal-50"
              >
                ต่ำกว่าเกณฑ์
              </Link>
            </div>
          ) : null}
        </div>

        <div className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-teal-100/80">
              <Package className="h-3.5 w-3.5" />
              รายการทั้งหมด
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">
              {summary.totalAssets.toLocaleString("th-TH")}
            </div>
            <p className="mt-1 text-xs text-teal-50/70">
              ปกติ {summary.normal.total.toLocaleString("th-TH")} · ต่ำกว่าเกณฑ์{" "}
              {summary.lowValue.total.toLocaleString("th-TH")}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-teal-100/80">
              <ShieldCheck className="h-3.5 w-3.5" />
              มูลค่ารวมโดยประมาณ
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">
              {money(summary.totalValue)}
            </div>
            <p className="mt-1 text-xs text-teal-50/70">บาท (ราคา × จำนวน)</p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-teal-100/80">
              <PackageMinus className="h-3.5 w-3.5" />
              ใช้อยู่
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">
              {summary.healthyCount.toLocaleString("th-TH")}
            </div>
            <p className="mt-1 text-xs text-teal-50/70">
              {summary.totalAssets
                ? Math.round((summary.healthyCount / summary.totalAssets) * 100)
                : 0}
              % ของทั้งหมด
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-teal-100/80">
              <AlertTriangle className="h-3.5 w-3.5" />
              ต้องติดตาม
            </div>
            <div className="mt-2 text-3xl font-bold tabular-nums">
              {summary.attentionCount.toLocaleString("th-TH")}
            </div>
            <p className="mt-1 text-xs text-teal-50/70">
              ชำรุด / เสื่อม / สูญ / ไม่ใช้ · {attentionShare}%
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <RegistryPanel
          title="ครุภัณฑ์ปกติ"
          href="/assets"
          snapshot={summary.normal}
          accent="teal"
        />
        <RegistryPanel
          title="ครุภัณฑ์ต่ำกว่าเกณฑ์"
          href="/assets/low-value"
          snapshot={summary.lowValue}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50 to-white p-5 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-semibold text-orange-950">
            จุดที่ผู้บริหารควรติดตาม
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-slate-700">ชำรุด</span>
              <span className="tabular-nums font-semibold text-orange-900">
                {(summary.normal.damaged + summary.lowValue.damaged).toLocaleString("th-TH")}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-slate-700">เสื่อมสภาพ</span>
              <span className="tabular-nums font-semibold text-orange-900">
                {(
                  summary.normal.deteriorated + summary.lowValue.deteriorated
                ).toLocaleString("th-TH")}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-slate-700">สูญไป</span>
              <span className="tabular-nums font-semibold text-red-800">
                {(summary.normal.lost + summary.lowValue.lost).toLocaleString("th-TH")}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-slate-700">ไม่ใช้</span>
              <span className="tabular-nums font-semibold text-slate-800">
                {(summary.normal.unused + summary.lowValue.unused).toLocaleString("th-TH")}
              </span>
            </li>
          </ul>
          {summary.recentSyncAt ? (
            <p className="mt-5 border-t border-orange-100 pt-3 text-xs text-slate-500">
              Sync ล่าสุด {formatDateTimeTH(summary.recentSyncAt)}
              {summary.recentSyncDevice ? ` · ${summary.recentSyncDevice}` : ""}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">ภาพรวมงานอื่นในระบบ</h3>
            {!publicMode ? (
              <Link href="/reports" className="text-xs font-medium text-teal-800 hover:underline">
                ศูนย์รายงาน
              </Link>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "ที่ดิน", value: kpis.landParcels, href: "/land", icon: LandPlot },
              { label: "วัสดุ", value: kpis.materials, href: "/inventory/materials", icon: Boxes },
              {
                label: "ค้างตรวจ",
                value: kpis.openInspectionPending,
                href: "/inspection",
                icon: ClipboardList,
              },
              { label: "ซ่อมค้าง", value: kpis.openMaintenance, href: "/maintenance", icon: Wrench },
            ].map((item) => {
              const Icon = item.icon;
              const className =
                "rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 transition hover:border-teal-300 hover:bg-teal-50/50";
              const body = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{item.label}</span>
                    <Icon className="h-3.5 w-3.5 text-teal-700" />
                  </div>
                  <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                    {item.value.toLocaleString("th-TH")}
                  </div>
                </>
              );
              if (publicMode) {
                return (
                  <div key={item.label} className={className}>
                    {body}
                  </div>
                );
              }
              return (
                <Link key={item.label} href={item.href} className={className} {...linkProps}>
                  {body}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">โอนค้าง {kpis.openTransfers.toLocaleString("th-TH")}</Badge>
            <Badge variant="secondary">
              จำหน่ายค้าง {kpis.openDisposals.toLocaleString("th-TH")}
            </Badge>
            <Badge variant={kpis.lowStockCount > 0 ? "warning" : "success"}>
              สต็อกต่ำ {kpis.lowStockCount.toLocaleString("th-TH")}
            </Badge>
            <Badge variant="secondary">
              Audit 7 วัน {kpis.recentAudit.toLocaleString("th-TH")}
            </Badge>
          </div>
        </section>
      </div>
    </div>
  );
}
