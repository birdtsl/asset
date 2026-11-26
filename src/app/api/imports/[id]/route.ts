import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);
    const { id } = await params;
    const batch = await prisma.importBatch.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { fullName: true, username: true } },
      },
    });
    if (!batch) {
      return NextResponse.json({ error: "ไม่พบชุดนำเข้า" }, { status: 404 });
    }
    return NextResponse.json({ data: batch });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
