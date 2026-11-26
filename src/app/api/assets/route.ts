import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { AssetClass, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);
    const sp = req.nextUrl.searchParams;
    const assetClass = sp.get("assetClass") as AssetClass | null;
    const q = sp.get("q")?.trim() || "";
    const take = Math.min(Number(sp.get("take") || 50), 200);
    const skip = Math.max(Number(sp.get("skip") || 0), 0);

    const where: Prisma.AssetWhereInput = {
      isActive: true,
      ...(assetClass ? { assetClass } : {}),
      ...(q
        ? {
            OR: [
              { assetCode: { contains: q } },
              { itemName: { contains: q } },
              { categoryName: { contains: q } },
              { locationText: { contains: q } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: [{ categoryName: "asc" }, { assetCode: "asc" }],
        skip,
        take,
        include: {
          status: true,
        },
      }),
      prisma.asset.count({ where }),
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
