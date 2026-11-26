import { Prisma, type AssetClass } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildReceivedAt,
  normalizeThaiMonth,
} from "@/lib/excel/asset-import";

export type SyncAssetDelta = {
  assetCode: string;
  assetClass: AssetClass;
  typeCode?: string | null;
  seqNo?: number | null;
  yearCode?: string | null;
  categoryName?: string | null;
  itemName: string;
  acquireMethod?: string | null;
  brandModel?: string | null;
  locationText?: string | null;
  receiveDay?: number | null;
  receiveMonth?: string | null;
  receiveYearBe?: number | null;
  unitPrice?: number | null;
  quantity?: number | null;
  checkDamaged?: boolean;
  checkDeteriorated?: boolean;
  checkLost?: boolean;
  checkUnused?: boolean;
  checkInUse?: boolean;
  checkRemark?: string | null;
  contentHash?: string;
};

export async function applyAssetDeltas(params: {
  deviceId: string;
  rows: SyncAssetDelta[];
  userId?: string | null;
}) {
  const defaultStatus = await prisma.assetStatus.findFirst({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: Array<{ assetCode: string; error: string }> = [];

  for (const row of params.rows) {
    const assetCode = row.assetCode?.trim();
    const itemName = row.itemName?.trim();
    if (!assetCode || !itemName) {
      skipped += 1;
      continue;
    }

    try {
      const receiveMonth = normalizeThaiMonth(row.receiveMonth ?? null);
      const receivedAt = buildReceivedAt(
        row.receiveDay ?? null,
        receiveMonth ?? row.receiveMonth ?? null,
        row.receiveYearBe ?? null,
      );
      const quantity =
        row.quantity != null && row.quantity > 0 ? Number(row.quantity) : 1;
      const unitPrice =
        row.unitPrice != null && Number.isFinite(row.unitPrice)
          ? Number(row.unitPrice)
          : null;
      const totalValue =
        unitPrice != null
          ? Number((quantity * unitPrice).toFixed(2))
          : null;

      const payload = {
        assetClass: row.assetClass,
        typeCode: row.typeCode ?? null,
        seqNo: row.seqNo ?? null,
        yearCode: row.yearCode ?? null,
        categoryName: row.categoryName ?? null,
        itemName,
        acquireMethod: row.acquireMethod ?? null,
        brandModel: row.brandModel ?? null,
        locationText: row.locationText ?? null,
        receiveDay: row.receiveDay ?? null,
        receiveMonth: receiveMonth ?? row.receiveMonth ?? null,
        receiveYearBe: row.receiveYearBe ?? null,
        receivedAt,
        quantity: new Prisma.Decimal(quantity),
        unitPrice:
          unitPrice != null ? new Prisma.Decimal(unitPrice) : null,
        totalValue:
          totalValue != null ? new Prisma.Decimal(totalValue) : null,
        checkDamaged: Boolean(row.checkDamaged),
        checkDeteriorated: Boolean(row.checkDeteriorated),
        checkLost: Boolean(row.checkLost),
        checkUnused: Boolean(row.checkUnused),
        checkInUse: Boolean(row.checkInUse),
        checkRemark: row.checkRemark ?? null,
        statusId: defaultStatus?.id ?? null,
        isActive: true,
      };

      const existing = await prisma.asset.findUnique({
        where: { assetCode },
        select: { id: true },
      });

      if (existing) {
        await prisma.asset.update({
          where: { id: existing.id },
          data: payload,
        });
        updated += 1;
      } else {
        await prisma.asset.create({
          data: { assetCode, ...payload },
        });
        created += 1;
      }
    } catch (err) {
      errors.push({
        assetCode,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: "SYNC_AGENT_UPSERT",
      entity: "Asset",
      entityId: params.deviceId.slice(0, 50),
      detail: JSON.stringify({
        deviceId: params.deviceId,
        received: params.rows.length,
        created,
        updated,
        skipped,
        errorCount: errors.length,
      }),
    },
  });

  return { created, updated, skipped, errors };
}
