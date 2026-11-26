import { PageHeader } from "@/components/master/page-header";
import { SyncAgentPanel } from "@/components/assets/sync-agent-panel";

export default function SyncAgentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sync Agent"
        description="ดาวน์โหลดตัวติดตั้งและทดสอบการเชื่อมต่อสำหรับดึงข้อมูล Excel จากเครื่อง client"
      />
      <SyncAgentPanel />
    </div>
  );
}
