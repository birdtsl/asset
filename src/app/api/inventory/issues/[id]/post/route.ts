import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { postIssue } from "@/lib/inventory/stock-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
    const { id } = await params;
    const issue = await postIssue(id, user.id);
    return NextResponse.json({ data: issue });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
