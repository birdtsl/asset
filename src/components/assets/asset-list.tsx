import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateTH } from "@/lib/utils";

type AssetRow = {
  id: string;
  assetCode: string;
  typeCode?: string | null;
  acquireSeq?: string | null;
  itemName: string;
  categoryName: string | null;
  locationText: string | null;
  unitPrice: { toString(): string } | null;
  quantity: { toString(): string };
  unitName: string | null;
  receivedAt: Date | null;
  receiveDay?: number | null;
  receiveMonth?: string | null;
  receiveYearBe?: number | null;
  checkDamaged?: boolean;
  checkDeteriorated?: boolean;
  checkLost?: boolean;
  checkUnused?: boolean;
  checkInUse?: boolean;
  status?: { name: string } | null;
  location?: { name: string; code: string } | null;
};

function displayReceivedAt(row: AssetRow) {
  if (row.receivedAt) return formatDateTH(row.receivedAt);
  const parts = [row.receiveDay, row.receiveMonth, row.receiveYearBe]
    .filter((v) => v != null && String(v).trim() !== "")
    .join(" ");
  return parts || "-";
}

const TYPE_CODE_RE = /^(\d{4}-\d{3}-\d{4})/;

function displayTypeCode(row: AssetRow) {
  if (row.typeCode) {
    const fromType = row.typeCode.match(TYPE_CODE_RE);
    if (fromType) return fromType[1];
  }
  const fromAsset = String(row.assetCode || "").match(TYPE_CODE_RE);
  if (fromAsset) return fromAsset[1];
  return row.typeCode?.trim() || "-";
}

function displayLocation(row: AssetRow) {
  if (row.location?.name) return row.location.name;
  const text = row.locationText?.trim();
  if (!text) return "-";
  if (/^\d+$/.test(text)) return "-";
  return text;
}

function CheckMark({ on }: { on?: boolean }) {
  return (
    <span
      className={
        on
          ? "inline-flex h-6 w-6 items-center justify-center rounded bg-teal-100 text-sm font-semibold text-teal-800"
          : "inline-flex h-6 w-6 items-center justify-center text-slate-300"
      }
      aria-label={on ? "ใช่" : "ไม่ใช่"}
    >
      {on ? "✓" : "–"}
    </span>
  );
}

function statusLabel(row: AssetRow) {
  if (row.checkDamaged) return "ชำรุด";
  if (row.checkDeteriorated) return "เสื่อมสภาพ";
  if (row.checkLost) return "สูญไป";
  if (row.checkUnused) return "ไม่ใช้";
  if (row.checkInUse) return "ใช้อยู่";
  return row.status?.name ?? "ใช้งาน";
}

export function AssetListTable({
  rows,
  emptyText,
  showTypeCode = true,
}: {
  rows: AssetRow[];
  emptyText: string;
  showTypeCode?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {showTypeCode ? (
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
                กำหนดรหัสครุภัณฑ์
              </th>
            ) : null}
            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
              รหัสครุภัณฑ์
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
              รายการ
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
              ประเภท
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
              สถานที่
            </th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500">
              ราคา
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
              วันที่ได้มา
            </th>
            <th className="px-2 py-3 text-center text-xs font-semibold text-slate-500">
              ชำรุด
            </th>
            <th className="px-2 py-3 text-center text-xs font-semibold text-slate-500">
              เสื่อมสภาพ
            </th>
            <th className="px-2 py-3 text-center text-xs font-semibold text-slate-500">
              สูญไป
            </th>
            <th className="px-2 py-3 text-center text-xs font-semibold text-slate-500">
              ไม่ใช้
            </th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
              สถานะ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              {showTypeCode ? (
                <td className="px-3 py-3 align-top font-mono text-xs text-slate-700">
                  {displayTypeCode(row)}
                </td>
              ) : null}
              <td className="px-3 py-3 align-top">
                <Link
                  href={`/assets/${row.id}`}
                  className="font-medium text-teal-800 hover:underline"
                >
                  {row.assetCode}
                </Link>
                {row.acquireSeq ? (
                  <div className="mt-0.5 text-xs text-slate-500">
                    ลำดับที่ได้มา: {row.acquireSeq}
                  </div>
                ) : null}
              </td>
              <td className="px-3 py-3 align-top text-slate-800">{row.itemName}</td>
              <td className="px-3 py-3 align-top text-slate-600">
                {row.categoryName ?? "-"}
              </td>
              <td className="px-3 py-3 align-top text-slate-600">
                {displayLocation(row)}
              </td>
              <td className="px-3 py-3 align-top text-right text-slate-800">
                {row.unitPrice
                  ? Number(row.unitPrice.toString()).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })
                  : "-"}
                {row.unitName ? (
                  <span className="ml-1 text-xs text-slate-400">
                    /{row.unitName}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-3 align-top text-slate-600">
                {displayReceivedAt(row)}
              </td>
              <td className="px-2 py-3 align-top text-center">
                <CheckMark on={row.checkDamaged} />
              </td>
              <td className="px-2 py-3 align-top text-center">
                <CheckMark on={row.checkDeteriorated} />
              </td>
              <td className="px-2 py-3 align-top text-center">
                <CheckMark on={row.checkLost} />
              </td>
              <td className="px-2 py-3 align-top text-center">
                <CheckMark on={row.checkUnused} />
              </td>
              <td className="px-3 py-3 align-top">
                <Badge
                  variant={
                    row.checkDamaged || row.checkLost
                      ? "warning"
                      : "secondary"
                  }
                >
                  {statusLabel(row)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
