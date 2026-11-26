import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/master/page-header";
import { MasterTable } from "@/components/master/master-table";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: [{ code: "asc" }],
    include: { department: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader title="สถานที่ตั้ง" description="อาคาร / ชั้น / ห้อง" />
      <MasterTable
        columns={[
          { key: "code", label: "รหัส" },
          { key: "name", label: "ชื่อสถานที่" },
          { key: "building", label: "อาคาร" },
          { key: "floor", label: "ชั้น" },
          { key: "room", label: "ห้อง" },
          { key: "department", label: "หน่วยงาน" },
        ]}
        rows={locations.map((l) => ({
          id: l.id,
          code: l.code,
          name: l.name,
          building: l.building ?? "-",
          floor: l.floor ?? "-",
          room: l.room ?? "-",
          department: l.department?.name ?? "-",
          isActive: l.isActive,
        }))}
        emptyText="ยังไม่มีข้อมูลสถานที่ตั้ง"
      />
    </div>
  );
}
