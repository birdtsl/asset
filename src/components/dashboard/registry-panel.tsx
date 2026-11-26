import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { AssetClassSnapshot } from "@/lib/reports/asset-executive";
import { AssetStatusChart } from "@/components/dashboard/asset-status-chart";
import { CategoryBars } from "@/components/dashboard/category-bars";
import { cn } from "@/lib/utils";

function money(n: number) {
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function compactMoney(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("th-TH", {
      maximumFractionDigits: 2,
    })} ล.`;
  }
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export function RegistryPanel({
  title,
  href,
  snapshot,
  accent,
}: {
  title: string;
  href: string;
  snapshot: AssetClassSnapshot;
  accent: "teal" | "amber";
}) {
  const statusData = [
    {
      name: "ใช้อยู่",
      code: "IN_USE",
      value: snapshot.inUse,
      amount: snapshot.inUseValue,
      href: `${href}?status=IN_USE`,
    },
    {
      name: "ชำรุด",
      code: "DAMAGED",
      value: snapshot.damaged,
      amount: snapshot.damagedValue,
      href: `${href}?status=DAMAGED`,
    },
    {
      name: "ไม่ระบุ",
      code: "UNSET",
      value: snapshot.noStatus,
      amount: snapshot.noStatusValue,
      href: `${href}?status=UNSET`,
    },
    {
      name: "เสื่อมสภาพ",
      code: "DETERIORATED",
      value: snapshot.deteriorated,
      amount: snapshot.deterioratedValue,
      href: `${href}?status=DETERIORATED`,
    },
    {
      name: "สูญไป",
      code: "LOST",
      value: snapshot.lost,
      amount: snapshot.lostValue,
      href: `${href}?status=LOST`,
    },
    {
      name: "ไม่ใช้",
      code: "UNUSED",
      value: snapshot.unused,
      amount: snapshot.unusedValue,
      href: `${href}?status=UNUSED`,
    },
  ];

  const focusCards = statusData.filter((s) =>
    ["IN_USE", "DAMAGED", "UNSET"].includes(s.code),
  );

  const risk =
    snapshot.damaged + snapshot.lost + snapshot.unused + snapshot.deteriorated;
  const riskValue =
    snapshot.damagedValue +
    snapshot.lostValue +
    snapshot.unusedValue +
    snapshot.deterioratedValue;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm",
        accent === "teal" ? "border-teal-200" : "border-amber-200",
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-3 px-5 py-4",
          accent === "teal"
            ? "bg-gradient-to-r from-teal-800 to-teal-600 text-white"
            : "bg-gradient-to-r from-amber-800 to-amber-600 text-white",
        )}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            ทะเบียน
          </p>
          <h3 className="mt-0.5 text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-white/80">
            มูลค่ารวม {money(snapshot.bookValue)} บาท
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">
            {snapshot.total.toLocaleString("th-TH")}
          </div>
          <div className="text-xs text-white/75">รายการ</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-slate-100 px-4 py-3">
        {focusCards.map((card) => (
          <Link
            key={card.code}
            href={card.href}
            className={cn(
              "rounded-xl border px-2.5 py-2.5 transition hover:-translate-y-0.5 hover:shadow-sm",
              card.code === "IN_USE" &&
                "border-teal-200 bg-teal-50/80 hover:border-teal-400",
              card.code === "DAMAGED" &&
                "border-orange-200 bg-orange-50/80 hover:border-orange-400",
              card.code === "UNSET" &&
                "border-slate-200 bg-slate-50 hover:border-slate-400",
            )}
          >
            <div className="text-[11px] font-medium text-slate-600">
              {card.name}
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {card.value.toLocaleString("th-TH")}
            </div>
            <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">
              {compactMoney(card.amount)} บาท
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            สถานะตรวจสภาพ · คลิกเพื่อเปิดรายการ
          </h4>
          <AssetStatusChart data={statusData} />
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            ประเภท · คลิกเพื่อเปิดรายการ
          </h4>
          <CategoryBars items={snapshot.topCategories} basePath={href} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={`${href}?status=IN_USE`}
            className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-800 hover:bg-teal-100"
          >
            ใช้อยู่ {snapshot.inUse.toLocaleString("th-TH")} ·{" "}
            {compactMoney(snapshot.inUseValue)} บาท
          </Link>
          <Link
            href={`${href}?status=DAMAGED`}
            className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-800 hover:bg-orange-100"
          >
            ชำรุด {snapshot.damaged.toLocaleString("th-TH")} ·{" "}
            {compactMoney(snapshot.damagedValue)} บาท
          </Link>
          <Link
            href={`${href}?status=UNSET`}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 hover:bg-slate-200"
          >
            ไม่ระบุ {snapshot.noStatus.toLocaleString("th-TH")} ·{" "}
            {compactMoney(snapshot.noStatusValue)} บาท
          </Link>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">
            ต้องติดตาม {risk.toLocaleString("th-TH")} · {compactMoney(riskValue)}{" "}
            บาท
          </span>
        </div>
        <Link
          href={href}
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium hover:underline",
            accent === "teal" ? "text-teal-800" : "text-amber-800",
          )}
        >
          เปิดทะเบียน
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
