import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { askSystemAssistant } from "@/lib/assistant/system-assistant";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.DASHBOARD_VIEW);
    const body = await req.json().catch(() => ({}));
    const question = String(body.question || "").slice(0, 1000);
    const result = await askSystemAssistant(question);

    const session = await auth();
    if (session?.user?.id) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "ASSISTANT_ASK",
          entity: "Assistant",
          detail: question.slice(0, 300),
        },
      });
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
