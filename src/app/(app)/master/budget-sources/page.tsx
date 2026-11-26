import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { MasterTable } from "@/components/master/master-table";

export default async function BudgetSourcesPage() {
  const items = await prisma.budgetSource.findMany({
    orderBy: [{ code: "asc" }],
  });

  return (
    <div>
      <PageHeader title="แหล่งงบประมาณ" description="แหล่งเงินที่ใช้จัดหาครุภัณฑ์" />
      <MasterTable
        columns={[
          { key: "code", label: "รหัส" },
          { key: "name", label: "ชื่อแหล่งงบ" },
          { key: "description", label: "รายละเอียด" },
        ]}
        rows={items.map((i) => ({
          id: i.id,
          code: i.code,
          name: i.name,
          description: i.description ?? "-",
          isActive: i.isActive,
        }))}
        emptyText="ยังไม่มีข้อมูลแหล่งงบประมาณ"
      />
    </div>
  );
}
