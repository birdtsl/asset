import Link from "next/link";
import { PageHeader } from "@/components/master/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getExecutiveKpis } from "@/lib/reports/executive-kpis";
import {
  ClipboardList,
  FileBarChart,
  Package,
  Boxes,
  ScrollText,
  LandPlot,
} from "lucide-react";

const links = [
  {
    href: "/reports/assets",
    title: "รายงานครุภัณฑ์",
    desc: "สรุปตามประเภท / สถานที่",
    icon: Package,
  },
  {
    href: "/inventory/reports",
    title: "รายงานคลังวัสดุ",
    desc: "คงเหลือ / ความเคลื่อนไหว",
    icon: Boxes,
  },
  {
    href: "/inspection/reports",
    title: "รายงานตรวจประจำปี",
    desc: "สัดส่วนผลตรวจตามรอบ",
    icon: ClipboardList,
  },
  {
    href: "/land",
    title: "ทะเบียนที่ดิน",
    desc: "แปลงที่ดินและมูลค่า",
    icon: LandPlot,
  },
  {
    href: "/reports/audit",
    title: "บันทึกกิจกรรม",
    desc: "Audit log ของระบบ",
    icon: ScrollText,
  },
  {
    href: "/dashboard",
    title: "แดชบอร์ดผู้บริหาร",
    desc: "KPI รวมแบบเรียลไทม์",
    icon: FileBarChart,
  },
];

export default async function ReportsPage() {
  const kpis = await getExecutiveKpis();

  return (
    <div className="space-y-6">
      <PageHeader
        title="ศูนย์รายงาน"
        description="รวมรายงานและ KPI จากข้อมูลจริงในระบบ"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">ครุภัณฑ์ทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {(kpis.normalAssets + kpis.lowValueAssets).toLocaleString("th-TH")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">มูลค่าสต็อก</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {kpis.stockValue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">ค้างตรวจ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-700">
            {kpis.openInspectionPending.toLocaleString("th-TH")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">สต็อกต่ำ</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-rose-700">
            {kpis.lowStockCount.toLocaleString("th-TH")}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition hover:border-teal-300">
                <CardHeader>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
