import { PageHeader } from "@/components/master/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader>
          <CardTitle>อยู่ระหว่างพัฒนารอบถัดไป</CardTitle>
          <CardDescription>{phase}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          โมดูลนี้จะเปิดใช้งานหลัง Phase 1 ผ่านการตรวจสอบแล้ว
        </CardContent>
      </Card>
    </div>
  );
}
