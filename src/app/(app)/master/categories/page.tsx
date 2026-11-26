import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { MasterTable } from "@/components/master/master-table";

export default async function CategoriesPage() {
  const categories = await prisma.assetCategory.findMany({
    orderBy: [{ code: "asc" }],
    include: { parent: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader title="หมวดครุภัณฑ์" description="หมวดหมู่ / ประเภทครุภัณฑ์" />
      <MasterTable
        columns={[
          { key: "code", label: "รหัส" },
          { key: "name", label: "ชื่อหมวด" },
          { key: "parent", label: "หมวดแม่" },
          { key: "description", label: "รายละเอียด" },
        ]}
        rows={categories.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          parent: c.parent?.name ?? "-",
          description: c.description ?? "-",
          isActive: c.isActive,
        }))}
        emptyText="ยังไม่มีข้อมูลหมวดครุภัณฑ์"
      />
    </div>
  );
}
