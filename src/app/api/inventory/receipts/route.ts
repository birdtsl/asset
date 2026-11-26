import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { createReceiptDraft } from "@/lib/inventory/stock-service";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.INVENTORY_VIEW);
    const receipts = await prisma.stockReceipt.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        warehouse: true,
        supplier: true,
        _count: { select: { items: true } },
      },
    });
    return NextResponse.json({ data: receipts });
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
    const user = await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
    const body = await req.json();
    const receipt = await createReceiptDraft(body, user.id);
    return NextResponse.json({ data: receipt }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
