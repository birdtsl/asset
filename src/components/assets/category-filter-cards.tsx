import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  UNCATEGORIZED,
  buildAssetListHref,
  type AssetListQuery,
} from "@/lib/assets/list-query";
import type {
  CategoryCount,
  CategoryStatusSummary,
} from "@/lib/assets/category-status";

export { UNCATEGORIZED };
export type { CategoryCount, CategoryStatusSummary };

function StatusSummaryLines({
  status,
  emphasize,
}: {
  status: CategoryStatusSummary;
  emphasize?: boolean;
}) {
  const rows = [
    { key: "inUse", label: "ใช้อยู่", count: status.inUse },
    { key: "damaged", label: "ชำรุด", count: status.damaged },
    { key: "deteriorated", label: "เสื่อมสภาพ", count: status.deteriorated },
    { key: "lost", label: "สูญไป", count: status.lost },
    { key: "unused", label: "ไม่ใช้", count: status.unused },
  ].filter((r) => r.count > 0);

  if (rows.length === 0) {
    return (
      <div className="mt-2 text-[11px] text-slate-400">ไม่มีสรุปสถานะ</div>
    );
  }

  return (
    <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2">
      {rows.map((r) => (
        <div
          key={r.key}
          className={cn(
            "flex items-center justify-between gap-2 text-[11px] leading-snug",
            emphasize ? "text-teal-800" : "text-slate-500",
          )}
        >
          <span>{r.label}</span>
          <span className="tabular-nums font-medium">
            {r.count.toLocaleString("th-TH")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CategoryFilterCards({
  basePath,
  categories,
  total,
  totalStatus,
  selected,
  query,
}: {
  basePath: string;
  categories: CategoryCount[];
  total: number;
  totalStatus: CategoryStatusSummary;
  selected?: string;
  query: AssetListQuery;
}) {
  const active = selected || "";

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Link
        href={buildAssetListHref(basePath, {
          ...query,
          category: undefined,
          item: undefined,
        })}
        className={cn(
          "rounded-lg border px-3 py-3 transition-colors",
          active === ""
            ? "border-teal-700 bg-teal-50 shadow-sm"
            : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50",
        )}
      >
        <div className="text-xs font-medium text-slate-500">ทั้งหมด</div>
        <div
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums",
            active === "" ? "text-teal-900" : "text-slate-900",
          )}
        >
          {total.toLocaleString("th-TH")}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">รายการ</div>
        <StatusSummaryLines status={totalStatus} emphasize={active === ""} />
      </Link>

      {categories.map((cat) => {
        const key = cat.name ?? UNCATEGORIZED;
        const isActive = active === key;
        return (
          <Link
            key={key}
            href={buildAssetListHref(basePath, {
              ...query,
              category: key,
              item: undefined,
            })}
            className={cn(
              "rounded-lg border px-3 py-3 transition-colors",
              isActive
                ? "border-teal-700 bg-teal-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50",
            )}
            title={cat.name || "ไม่ระบุประเภท"}
          >
            <div
              className={cn(
                "line-clamp-2 min-h-8 text-xs font-medium leading-snug",
                isActive ? "text-teal-800" : "text-slate-600",
              )}
            >
              {cat.name || "ไม่ระบุประเภท"}
            </div>
            <div
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                isActive ? "text-teal-900" : "text-slate-900",
              )}
            >
              {cat.count.toLocaleString("th-TH")}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">รายการ</div>
            <StatusSummaryLines status={cat.status} emphasize={isActive} />
          </Link>
        );
      })}
    </div>
  );
}
