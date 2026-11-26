import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/rbac";
import { createImportBatch } from "@/lib/imports/service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ASSETS_VIEW);
    const batches = await prisma.importBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        uploadedBy: { select: { fullName: true, username: true } },
      },
    });
    return NextResponse.json({ data: batches });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

const uploadSchema = z.object({
  assetClass: z.enum(["NORMAL", "LOW_VALUE"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.ASSETS_IMPORT);
    const form = await req.formData();
    const file = form.get("file");
    const assetClassRaw = String(form.get("assetClass") || "NORMAL");
    const parsedMeta = uploadSchema.safeParse({ assetClass: assetClassRaw });
    if (!parsedMeta.success) {
      return NextResponse.json({ error: "assetClass ไม่ถูกต้อง" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์ Excel" }, { status: 400 });
    }

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xlsm") && !lower.endsWith(".xls")) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ Excel (.xlsx, .xlsm, .xls)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const batch = await createImportBatch({
      fileName: file.name,
      buffer,
      assetClass: parsedMeta.data.assetClass,
      userId: user.id,
    });

    return NextResponse.json({ data: batch }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
