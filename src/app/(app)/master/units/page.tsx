import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { MasterTable } from "@/components/master/master-table";

export default async function UnitsPage() {
  const units = await prisma.unit.findMany({ orderBy: [{ code: "asc" }] });

  return (
    <div>
      <PageHeader title="หน่วยนับ" description="หน่วยนับสำหรับครุภัณฑ์และวัสดุ" />
      <MasterTable
        columns={[
          { key: "code", label: "รหัส" },
          { key: "name", label: "ชื่อหน่วย" },
        ]}
        rows={units.map((u) => ({
          id: u.id,
          code: u.code,
          name: u.name,
          isActive: u.isActive,
        }))}
        emptyText="ยังไม่มีข้อมูลหน่วยนับ"
      />
    </div>
  );
}
