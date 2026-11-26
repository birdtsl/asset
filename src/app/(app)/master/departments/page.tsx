import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { MasterTable } from "@/components/master/master-table";

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    orderBy: [{ code: "asc" }],
    include: { parent: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="หน่วยงาน"
        description="ข้อมูลหลักหน่วยงานในโรงพยาบาล"
      />
      <MasterTable
        columns={[
          { key: "code", label: "รหัส" },
          { key: "name", label: "ชื่อหน่วยงาน" },
          { key: "parent", label: "หน่วยงานแม่" },
        ]}
        rows={departments.map((d) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          parent: d.parent?.name ?? "-",
          isActive: d.isActive,
        }))}
        emptyText="ยังไม่มีข้อมูลหน่วยงาน"
      />
    </div>
  );
}
