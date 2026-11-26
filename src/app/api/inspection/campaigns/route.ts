import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createInspectionCampaign } from "@/lib/inspection/inspection-service";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);
    const data = await prisma.inspectionCampaign.findMany({
      orderBy: [{ yearBe: "desc" }, { createdAt: "desc" }],
      include: {
        _count: { select: { items: true } },
        createdBy: { select: { fullName: true } },
      },
    });
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.ASSETS_MANAGE);
    const body = await req.json();
    const campaign = await createInspectionCampaign(body, user.id);
    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
