import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { MasterTable } from "@/components/master/master-table";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: [{ code: "asc" }],
  });

  return (
    <div>
      <PageHeader title="ผู้จำหน่าย" description="ร้านค้า / บริษัทผู้จำหน่าย" />
      <MasterTable
        columns={[
          { key: "code", label: "รหัส" },
          { key: "name", label: "ชื่อ" },
          { key: "phone", label: "โทรศัพท์" },
          { key: "contactName", label: "ผู้ติดต่อ" },
        ]}
        rows={suppliers.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          phone: s.phone ?? "-",
          contactName: s.contactName ?? "-",
          isActive: s.isActive,
        }))}
        emptyText="ยังไม่มีข้อมูลผู้จำหน่าย"
      />
    </div>
  );
}
