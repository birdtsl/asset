import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createTransfer } from "@/lib/lifecycle/lifecycle-service";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);
    const data = await prisma.assetTransfer.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        asset: { select: { assetCode: true, itemName: true } },
        toDepartment: true,
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
    const data = await createTransfer(body, user.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
