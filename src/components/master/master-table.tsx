import { Badge } from "@/components/ui/badge";

export type MasterColumn = {
  key: string;
  label: string;
  className?: string;
};

export type MasterRow = Record<string, React.ReactNode> & {
  id: string;
  isActive?: boolean;
};

export function MasterTable({
  columns,
  rows,
  emptyText = "ยังไม่มีข้อมูล",
}: {
  columns: MasterColumn[];
  rows: MasterRow[];
  emptyText?: string;
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
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${col.className ?? ""}`}
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              สถานะ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-slate-800 ${col.className ?? ""}`}>
                  {row[col.key]}
                </td>
              ))}
              <td className="px-4 py-3">
                {row.isActive === false ? (
                  <Badge variant="warning">ปิดใช้งาน</Badge>
                ) : (
                  <Badge variant="success">ใช้งาน</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
