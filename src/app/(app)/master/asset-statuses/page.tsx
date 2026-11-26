import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { MasterTable } from "@/components/master/master-table";

export default async function AssetStatusesPage() {
  const statuses = await prisma.assetStatus.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });

  return (
    <div>
      <PageHeader title="สถานะครุภัณฑ์" description="สถานะการใช้งานครุภัณฑ์" />
      <MasterTable
        columns={[
          { key: "code", label: "รหัส" },
          { key: "name", label: "ชื่อสถานะ" },
          { key: "description", label: "รายละเอียด" },
          { key: "sortOrder", label: "ลำดับ" },
        ]}
        rows={statuses.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          description: s.description ?? "-",
          sortOrder: s.sortOrder,
          isActive: s.isActive,
        }))}
        emptyText="ยังไม่มีข้อมูลสถานะครุภัณฑ์"
      />
    </div>
  );
}
