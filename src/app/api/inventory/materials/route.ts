import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.INVENTORY_VIEW);
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";
    const materials = await prisma.material.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { code: { contains: q } },
                { name: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        unit: true,
        balances: { include: { warehouse: true } },
      },
      orderBy: [{ code: "asc" }],
      take: 200,
    });
    return NextResponse.json({ data: materials });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  minStock: z.number().nonnegative().optional(),
  reorderPoint: z.number().nonnegative().optional(),
  description: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
    const body = createSchema.parse(await req.json());
    const material = await prisma.material.create({
      data: {
        code: body.code,
        name: body.name,
        categoryId: body.categoryId || null,
        unitId: body.unitId || null,
        minStock: body.minStock ?? 0,
        reorderPoint: body.reorderPoint ?? 0,
        description: body.description || null,
      },
    });
    return NextResponse.json({ data: material }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
