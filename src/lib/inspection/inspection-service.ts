import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildAssetQrUrl, createQrToken } from "@/lib/inspection/qr";
import { toDateOnly } from "@/lib/lifecycle/doc-no";

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function ensureAssetQrToken(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("ไม่พบครุภัณฑ์");
  if (asset.qrToken) {
    return {
      token: asset.qrToken,
      url: buildAssetQrUrl(asset.qrToken),
      asset,
    };
  }
  const token = createQrToken(assetId);
  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: { qrToken: token, qrGeneratedAt: new Date() },
  });
  return { token, url: buildAssetQrUrl(token), asset: updated };
}

export async function generateMissingQrTokens(limit = 500) {
  const assets = await prisma.asset.findMany({
    where: { isActive: true, qrToken: null },
    select: { id: true },
    take: limit,
  });

  let generated = 0;
  for (const part of chunk(assets, 100)) {
    await prisma.$transaction(
      part.map((a) =>
        prisma.asset.update({
          where: { id: a.id },
          data: {
            qrToken: createQrToken(a.id),
            qrGeneratedAt: new Date(),
          },
        }),
      ),
    );
    generated += part.length;
  }
  return { generated, remainingHint: assets.length === limit };
}

export const campaignCreateSchema = z.object({
  yearBe: z.number().int().min(2500).max(2800),
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  includeLowValue: z.boolean().optional().default(true),
});

export async function createInspectionCampaign(
  input: z.infer<typeof campaignCreateSchema>,
  userId: string,
) {
  const data = campaignCreateSchema.parse(input);

  const campaign = await prisma.inspectionCampaign.create({
    data: {
      yearBe: data.yearBe,
      title: data.title,
      startDate: toDateOnly(data.startDate),
      endDate: data.endDate ? toDateOnly(data.endDate) : null,
      notes: data.notes || null,
      status: "IN_PROGRESS",
      createdById: userId,
    },
  });

  const assets = await prisma.asset.findMany({
    where: {
      isActive: true,
      ...(data.includeLowValue
        ? {}
        : { assetClass: "NORMAL" }),
    },
    select: { id: true },
  });

  for (const part of chunk(assets, 200)) {
    await prisma.inspectionItem.createMany({
      data: part.map((a) => ({
        campaignId: campaign.id,
        assetId: a.id,
        result: "PENDING",
      })),
      skipDuplicates: true,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "INSPECTION_CREATE",
      entity: "InspectionCampaign",
      entityId: campaign.id,
      detail: `สร้างรอบตรวจ ${data.title} ปี ${data.yearBe} จำนวน ${assets.length} รายการ`,
    },
  });

  return campaign;
}

export const inspectItemSchema = z.object({
  result: z.enum(["PASS", "FAIL", "REPAIR_NEEDED", "MISSING", "DISPOSED"]),
  conditionNote: z.string().optional().nullable(),
  locationFound: z.string().optional().nullable(),
});

export async function recordInspection(
  itemId: string,
  input: z.infer<typeof inspectItemSchema>,
  userId: string,
) {
  const data = inspectItemSchema.parse(input);
  const item = await prisma.inspectionItem.findUnique({
    where: { id: itemId },
    include: { campaign: true },
  });
  if (!item) throw new Error("ไม่พบรายการตรวจ");
  if (item.campaign.status === "CLOSED") {
    throw new Error("รอบตรวจนี้ปิดแล้ว");
  }

  const updated = await prisma.inspectionItem.update({
    where: { id: itemId },
    data: {
      result: data.result,
      conditionNote: data.conditionNote || null,
      locationFound: data.locationFound || null,
      inspectedAt: new Date(),
      inspectedById: userId,
    },
    include: {
      asset: true,
    },
  });

  return updated;
}

export async function closeInspectionCampaign(id: string, userId: string) {
  const campaign = await prisma.inspectionCampaign.findUnique({
    where: { id },
  });
  if (!campaign) throw new Error("ไม่พบรอบตรวจ");
  if (campaign.status === "CLOSED") throw new Error("รอบตรวจถูกปิดแล้ว");

  const updated = await prisma.inspectionCampaign.update({
    where: { id },
    data: {
      status: "CLOSED",
      endDate: campaign.endDate ?? toDateOnly(new Date()),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "INSPECTION_CLOSE",
      entity: "InspectionCampaign",
      entityId: id,
      detail: `ปิดรอบตรวจ ${campaign.title}`,
    },
  });

  return updated;
}
