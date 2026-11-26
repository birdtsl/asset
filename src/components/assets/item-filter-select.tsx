"use client";

import { useRouter } from "next/navigation";
import {
  buildAssetListHref,
  type AssetListQuery,
} from "@/lib/assets/list-query";

export type ItemOption = {
  name: string;
  count: number;
};

export function ItemFilterSelect({
  basePath,
  items,
  selected,
  query,
}: {
  basePath: string;
  items: ItemOption[];
  selected?: string;
  query: AssetListQuery;
}) {
  const router = useRouter();

  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
      <span className="shrink-0 text-xs font-medium text-slate-500">รายการ:</span>
      <select
        value={selected || ""}
        onChange={(e) => {
          const value = e.target.value;
          router.push(
            buildAssetListHref(basePath, {
              ...query,
              item: value || undefined,
            }),
          );
        }}
        className="h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
      >
        <option value="">ทุกรายการ ({items.reduce((n, i) => n + i.count, 0).toLocaleString("th-TH")})</option>
        {items.map((item) => (
          <option key={item.name} value={item.name}>
            {item.name} ({item.count.toLocaleString("th-TH")})
          </option>
        ))}
      </select>
    </label>
  );
}
