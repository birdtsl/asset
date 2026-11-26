import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);
    const { id } = await params;
    const status = req.nextUrl.searchParams.get("status");
    const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 50), 200);
    const skip = Math.max(Number(req.nextUrl.searchParams.get("skip") || 0), 0);

    const where = {
      batchId: id,
      ...(status ? { status: status as never } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.importStagingRow.findMany({
        where,
        orderBy: { rowNo: "asc" },
        skip,
        take,
      }),
      prisma.importStagingRow.count({ where }),
    ]);

    return NextResponse.json({ data: rows, meta: { total, skip, take } });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
