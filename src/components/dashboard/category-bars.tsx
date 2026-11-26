"use client";

import Link from "next/link";
import { UNCATEGORIZED } from "@/lib/assets/list-query";

const BAR_COLORS = [
  "#0f766e",
  "#b45309",
  "#1d4ed8",
  "#be123c",
  "#7c3aed",
  "#0e7490",
];

function money(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("th-TH", {
      maximumFractionDigits: 2,
    })} ล.`;
  }
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export function CategoryBars({
  items,
  basePath,
}: {
  items: Array<{ name: string; count: number; value?: number }>;
  basePath: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">ยังไม่มีข้อมูลประเภท</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => {
        const categoryParam =
          item.name === "ไม่ระบุประเภท" ? UNCATEGORIZED : item.name;
        const href = `${basePath}?category=${encodeURIComponent(categoryParam)}`;
        return (
          <li key={item.name}>
            <Link
              href={href}
              className="block rounded-lg border border-transparent px-1 py-1 transition hover:border-teal-200 hover:bg-teal-50/40"
              title={`เปิดประเภท ${item.name}`}
            >
              <div className="mb-1 flex items-start justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-700">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                  <span className="truncate" title={item.name}>
                    {item.name}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block tabular-nums font-medium text-slate-900">
                    {item.count.toLocaleString("th-TH")}
                  </span>
                  <span className="block text-xs tabular-nums text-slate-500">
                    {money(item.value ?? 0)} บาท
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(6, (item.count / max) * 100)}%`,
                    background: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
