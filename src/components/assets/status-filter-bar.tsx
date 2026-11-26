import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  buildAssetListHref,
  type AssetListQuery,
} from "@/lib/assets/list-query";

export type StatusOption = {
  code: string;
  name: string;
  count: number;
};

export function StatusFilterBar({
  basePath,
  statuses,
  total,
  selected,
  query,
}: {
  basePath: string;
  statuses: StatusOption[];
  total: number;
  selected?: string;
  query: AssetListQuery;
}) {
  const active = selected || "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">สถานะ:</span>
      <Link
        href={buildAssetListHref(basePath, { ...query, status: undefined })}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
          active === ""
            ? "border-teal-700 bg-teal-50 text-teal-900"
            : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-slate-50",
        )}
      >
        ทั้งหมด
        <span className="tabular-nums text-slate-500">
          {total.toLocaleString("th-TH")}
        </span>
      </Link>
      {statuses.map((s) => {
        const isActive = active === s.code;
        return (
          <Link
            key={s.code}
            href={buildAssetListHref(basePath, { ...query, status: s.code })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-teal-700 bg-teal-50 text-teal-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-slate-50",
            )}
          >
            {s.name}
            <span className="tabular-nums text-slate-500">
              {s.count.toLocaleString("th-TH")}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
