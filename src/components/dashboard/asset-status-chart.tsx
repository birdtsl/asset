"use client";

import Link from "next/link";

const COLORS: Record<string, string> = {
  ใช้อยู่: "#0f766e",
  ชำรุด: "#c2410c",
  เสื่อมสภาพ: "#a16207",
  สูญไป: "#b91c1c",
  ไม่ใช้: "#475569",
  ไม่ระบุ: "#94a3b8",
};

export type StatusSlice = {
  name: string;
  code: string;
  value: number;
  amount: number;
  href: string;
};

function money(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toLocaleString("th-TH", {
      maximumFractionDigits: 2,
    })} ล.`;
  }
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export function AssetStatusChart({ data }: { data: StatusSlice[] }) {
  const priority = ["IN_USE", "DAMAGED", "UNSET"];
  const safe = (data ?? []).filter(
    (d): d is StatusSlice =>
      Boolean(d?.code && d?.href && typeof d.href === "string"),
  );
  const ordered = [
    ...priority
      .map((code) => safe.find((d) => d.code === code))
      .filter((d): d is StatusSlice => Boolean(d)),
    ...safe.filter((d) => !priority.includes(d.code) && d.value > 0),
  ];

  const totalCount = ordered.reduce((s, r) => s + r.value, 0) || 1;

  return (
    <ul className="space-y-2">
      {ordered.map((row) => (
        <li key={row.code}>
          <Link
            href={row.href}
            className="block rounded-lg border border-slate-100 px-3 py-2 transition hover:border-teal-300 hover:bg-teal-50/50"
            title={`เปิดรายการ${row.name}`}
          >
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: COLORS[row.name] ?? "#64748b" }}
                />
                {row.name}
              </span>
              <span className="tabular-nums text-slate-900">
                {row.value.toLocaleString("th-TH")}
                <span className="ml-1 text-xs text-slate-400">
                  ({Math.round((row.value / totalCount) * 100)}%)
                </span>
              </span>
            </div>
            <div className="mt-0.5 pl-4 text-xs tabular-nums text-slate-500">
              มูลค่า {money(row.amount)} บาท · คลิกเพื่อดูรายการ
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
