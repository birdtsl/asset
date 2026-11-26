import Link from "next/link";
import { PageHeader } from "@/components/master/page-header";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "@/components/inspection/campaign-form";

export default function NewInspectionPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="สร้างรอบตรวจประจำปี"
        description="ระบบจะโหลดครุภัณฑ์ที่ใช้งานอยู่เข้าสู่รายการตรวจอัตโนมัติ"
        actions={
          <Button asChild variant="outline">
            <Link href="/inspection">กลับรายการ</Link>
          </Button>
        }
      />
      <CampaignForm />
    </div>
  );
}
