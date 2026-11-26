import { PageHeader } from "@/components/master/page-header";
import { AssistantChatPage } from "@/components/assistant/assistant-chat-page";

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="ผู้ช่วยใช้งานภายในระบบ — ตอบจาก FAQ และตัวเลขจริงในฐานข้อมูล"
      />
      <AssistantChatPage />
    </div>
  );
}
