import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const materials = await prisma.material.findMany({
    where: {
      isActive: true,
      ...(query
        ? {
            OR: [
              { code: { contains: query } },
              { name: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      unit: true,
      balances: true,
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="รายการวัสดุ"
        description={`${materials.length} รายการ`}
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory">กลับคลัง</Link>
          </Button>
        }
      />

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="ค้นหารหัส / ชื่อวัสดุ"
          className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
        />
        <Button type="submit" variant="secondary">
          ค้นหา
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                รหัส
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                ชื่อวัสดุ
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                หมวด
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                หน่วย
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                คงเหลือรวม
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                จุดสั่งซื้อ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((m) => {
              const onHand = m.balances.reduce(
                (s, b) => s + Number(b.quantity),
                0,
              );
              const low = onHand <= Number(m.reorderPoint);
              return (
                <tr key={m.id}>
                  <td className="px-3 py-3 font-medium text-slate-800">{m.code}</td>
                  <td className="px-3 py-3 text-slate-800">{m.name}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {m.category?.name ?? "-"}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{m.unit?.name ?? "-"}</td>
                  <td className="px-3 py-3 text-right">
                    {onHand.toLocaleString("th-TH")}
                    {low ? (
                      <Badge className="ml-2" variant="warning">
                        ต่ำ
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600">
                    {Number(m.reorderPoint).toLocaleString("th-TH")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
