import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSyncAgentKey } from "@/lib/sync/agent-auth";
import { applyAssetDeltas } from "@/lib/sync/apply-delta";

const deltaSchema = z.object({
  assetCode: z.string().min(1).max(120),
  assetClass: z.enum(["NORMAL", "LOW_VALUE"]),
  typeCode: z.string().max(50).nullable().optional(),
  seqNo: z.number().int().nullable().optional(),
  yearCode: z.string().max(20).nullable().optional(),
  categoryName: z.string().max(150).nullable().optional(),
  itemName: z.string().min(1).max(255),
  acquireMethod: z.string().max(100).nullable().optional(),
  brandModel: z.string().nullable().optional(),
  locationText: z.string().max(255).nullable().optional(),
  receiveDay: z.number().int().nullable().optional(),
  receiveMonth: z.string().max(30).nullable().optional(),
  receiveYearBe: z.number().int().nullable().optional(),
  unitPrice: z.number().nonnegative().nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  checkDamaged: z.boolean().optional(),
  checkDeteriorated: z.boolean().optional(),
  checkLost: z.boolean().optional(),
  checkUnused: z.boolean().optional(),
  checkInUse: z.boolean().optional(),
  checkRemark: z.string().nullable().optional(),
  contentHash: z.string().max(128).optional(),
});

const bodySchema = z.object({
  deviceId: z.string().min(1).max(100),
  sourceFile: z.string().max(500).optional(),
  rows: z.array(deltaSchema).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    requireSyncAgentKey(req);

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "payload ไม่ถูกต้อง", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await applyAssetDeltas({
      deviceId: parsed.data.deviceId,
      rows: parsed.data.rows,
    });

    return NextResponse.json({
      ok: true,
      deviceId: parsed.data.deviceId,
      sourceFile: parsed.data.sourceFile ?? null,
      received: parsed.data.rows.length,
      ...result,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    requireSyncAgentKey(req);
    return NextResponse.json({
      ok: true,
      service: "tsl-smart-asset-sync",
      endpoint: "/api/sync/assets",
      accepts: "POST delta upsert from sheet chek",
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
