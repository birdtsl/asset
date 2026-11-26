import { Prisma, type AssetClass, type ImportCommitAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import {
  buildReceivedAt,
  checkFlagsByAssetCode,
  normalizeThaiMonth,
  parseChekWorkbook,
  parseRegistryWorkbook,
  validateParsedRow,
  type ParsedAssetRow,
} from "@/lib/excel/asset-import";
import { saveImportFile } from "@/lib/storage";

async function getLowValueThreshold() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "asset.low_value_threshold" },
  });
  const n = Number(setting?.value ?? 10000);
  return Number.isFinite(n) ? n : 10000;
}

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function createImportBatch(params: {
  fileName: string;
  buffer: Buffer;
  assetClass: AssetClass;
  userId: string;
}) {
  const { storedPath } = await saveImportFile(params.fileName, params.buffer);
  // Prefer sheet "chek" as the system source of truth; fall back to Data.
  const parsed = parseRegistryWorkbook(params.buffer);

  const batch = await prisma.importBatch.create({
    data: {
      fileName: params.fileName,
      storedPath,
      sheetName: parsed.sheetName,
      assetClass: params.assetClass,
      status: "UPLOADED",
      totalRows: parsed.rows.length,
      notes: `source=${parsed.source}`,
      uploadedById: params.userId,
    },
  });

  const stagingRows = parsed.rows.map((row) => ({
    batchId: batch.id,
    rowNo: row.rowNo,
    status: "PENDING" as const,
    rawJson: JSON.stringify(row.raw),
    assetCode: row.assetCode,
    typeCode: row.typeCode,
    acquireSeq: row.acquireSeq,
    yearCode: row.yearCode,
    seqNo: row.seqNo,
    categoryName: row.categoryName,
    itemName: row.itemName,
    usefulLifeYears: row.usefulLifeYears,
    budgetType: row.budgetType,
    acquireMethod: row.acquireMethod,
    brandModel: row.brandModel,
    locationText: row.locationText,
    documentRef: row.documentRef,
    receiveDay: row.receiveDay,
    receiveMonth: row.receiveMonth,
    receiveYearBe: row.receiveYearBe,
    quantity: row.quantity != null ? new Prisma.Decimal(row.quantity) : null,
    unitPrice: row.unitPrice != null ? new Prisma.Decimal(row.unitPrice) : null,
    unitName: row.unitName,
    calculateDepreciation: row.calculateDepreciation,
    vendorName: row.vendorName,
    vendorAddress: row.vendorAddress,
    vendorPhone: row.vendorPhone,
  }));

  for (const part of chunk(stagingRows, 200)) {
    await prisma.importStagingRow.createMany({ data: part });
  }

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: "IMPORT_UPLOAD",
      entity: "ImportBatch",
      entityId: batch.id,
      detail: `อัปโหลด ${params.fileName} (${params.assetClass}) ${parsed.rows.length} แถว`,
    },
  });

  return batch;
}

export async function validateImportBatch(batchId: string, userId: string) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: { rows: true },
  });
  if (!batch) throw new Error("ไม่พบชุดนำเข้า");
  if (batch.status === "COMMITTED") throw new Error("ชุดนี้นำเข้าแล้ว ไม่สามารถตรวจซ้ำ");

  const threshold = await getLowValueThreshold();
  const codes = batch.rows
    .map((r) => r.assetCode)
    .filter((c): c is string => !!c);

  const existing = codes.length
    ? await prisma.asset.findMany({
        where: { assetCode: { in: codes } },
        select: { id: true, assetCode: true },
      })
    : [];
  const existingMap = new Map(existing.map((a) => [a.assetCode, a.id]));
  const existingCodes = new Set(existingMap.keys());

  const seen = new Set<string>();
  const duplicateInBatch = new Set<string>();
  for (const code of codes) {
    if (seen.has(code)) duplicateInBatch.add(code);
    seen.add(code);
  }

  let validRows = 0;
  let warningRows = 0;
  let errorRows = 0;

  for (const part of chunk(batch.rows, 100)) {
    await prisma.$transaction(
      part.map((row) => {
        const parsed: ParsedAssetRow = {
          rowNo: row.rowNo,
          raw: JSON.parse(row.rawJson),
          typeCode: row.typeCode,
          acquireSeq: row.acquireSeq,
          yearCode: row.yearCode,
          seqNo: row.seqNo,
          categoryName: row.categoryName,
          itemName: row.itemName,
          assetCode: row.assetCode,
          usefulLifeYears: row.usefulLifeYears,
          budgetType: row.budgetType,
          acquireMethod: row.acquireMethod,
          brandModel: row.brandModel,
          locationText: row.locationText,
          documentRef: row.documentRef,
          receiveDay: row.receiveDay,
          receiveMonth: row.receiveMonth,
          receiveYearBe: row.receiveYearBe,
          quantity: row.quantity ? Number(row.quantity) : null,
          unitPrice: row.unitPrice ? Number(row.unitPrice) : null,
          unitName: row.unitName,
          calculateDepreciation: row.calculateDepreciation,
          vendorName: row.vendorName,
          vendorAddress: row.vendorAddress,
          vendorPhone: row.vendorPhone,
        };

        const result = validateParsedRow(parsed, {
          existingCodes,
          duplicateInBatch,
          assetClass: batch.assetClass,
          lowValueThreshold: threshold,
        });

        if (result.status === "VALID") validRows += 1;
        if (result.status === "WARNING") warningRows += 1;
        if (result.status === "ERROR") errorRows += 1;

        const matchedAssetId = row.assetCode
          ? existingMap.get(row.assetCode) ?? null
          : null;
        const commitAction: ImportCommitAction | null =
          result.status === "ERROR"
            ? "SKIP"
            : matchedAssetId
              ? "UPDATE"
              : "CREATE";

        return prisma.importStagingRow.update({
          where: { id: row.id },
          data: {
            status: result.status,
            validationErrors: JSON.stringify(result.errors),
            validationWarnings: JSON.stringify(result.warnings),
            matchedAssetId,
            commitAction,
          },
        });
      }),
    );
  }

  const updated = await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: errorRows > 0 && validRows + warningRows === 0 ? "FAILED" : "VALIDATED",
      validRows,
      warningRows,
      errorRows,
      validatedAt: new Date(),
      errorSummary:
        errorRows > 0
          ? `พบข้อผิดพลาด ${errorRows} แถว, เตือน ${warningRows} แถว, ผ่าน ${validRows} แถว`
          : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "IMPORT_VALIDATE",
      entity: "ImportBatch",
      entityId: batchId,
      detail: updated.errorSummary ?? `ตรวจผ่าน valid=${validRows} warning=${warningRows}`,
    },
  });

  return updated;
}

export async function commitImportBatch(batchId: string, userId: string) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: {
      rows: {
        where: {
          status: { in: ["VALID", "WARNING"] },
          commitAction: { in: ["CREATE", "UPDATE"] },
        },
      },
    },
  });

  if (!batch) throw new Error("ไม่พบชุดนำเข้า");
  if (batch.status === "COMMITTED") throw new Error("ชุดนี้นำเข้าแล้ว");
  if (batch.status !== "VALIDATED" && batch.status !== "FAILED") {
    throw new Error("ต้องตรวจสอบข้อมูลก่อนยืนยันนำเข้า");
  }
  if (batch.rows.length === 0) {
    throw new Error("ไม่มีแถวที่พร้อมนำเข้า");
  }

  const defaultStatus = await prisma.assetStatus.findUnique({
    where: { code: "IN_USE" },
  });

  let checkMap = new Map<
    string,
    {
      checkDamaged: boolean;
      checkDeteriorated: boolean;
      checkLost: boolean;
      checkUnused: boolean;
      checkInUse: boolean;
      checkRemark: string | null;
    }
  >();
  try {
    // storedPath is like "storage/imports/..." relative to cwd
    const filePath = path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      batch.storedPath,
    );
    const buf = await fs.readFile(filePath);
    checkMap = checkFlagsByAssetCode(parseChekWorkbook(buf));
  } catch {
    // sheet chek/check is optional
  }

  let committed = 0;

  for (const part of chunk(batch.rows, 50)) {
    await prisma.$transaction(async (tx) => {
      for (const row of part) {
        if (!row.assetCode || !row.itemName) continue;

        const quantity = row.quantity ? Number(row.quantity) : 1;
        const unitPrice = row.unitPrice ? Number(row.unitPrice) : null;
        const totalValue =
          unitPrice != null ? Number((quantity * unitPrice).toFixed(2)) : null;
        const receiveMonth = normalizeThaiMonth(row.receiveMonth);
        const receivedAt = buildReceivedAt(
          row.receiveDay,
          receiveMonth ?? row.receiveMonth,
          row.receiveYearBe,
        );
        const check = checkMap.get(row.assetCode);

        const payload = {
          assetClass: batch.assetClass,
          assetCode: row.assetCode,
          typeCode: row.typeCode,
          acquireSeq: row.acquireSeq,
          yearCode: row.yearCode,
          seqNo: row.seqNo,
          categoryName: row.categoryName,
          itemName: row.itemName,
          usefulLifeYears: row.usefulLifeYears,
          budgetType: row.budgetType,
          acquireMethod: row.acquireMethod,
          brandModel: row.brandModel,
          locationText: row.locationText,
          documentRef: row.documentRef,
          receiveDay: row.receiveDay,
          receiveMonth: receiveMonth ?? row.receiveMonth,
          receiveYearBe: row.receiveYearBe,
          receivedAt,
          quantity: new Prisma.Decimal(quantity),
          unitPrice:
            unitPrice != null ? new Prisma.Decimal(unitPrice) : null,
          totalValue:
            totalValue != null ? new Prisma.Decimal(totalValue) : null,
          unitName: row.unitName,
          calculateDepreciation: row.calculateDepreciation ?? true,
          vendorName: row.vendorName,
          vendorAddress: row.vendorAddress,
          vendorPhone: row.vendorPhone,
          statusId: defaultStatus?.id ?? null,
          sourceBatchId: batch.id,
          sourceRowNo: row.rowNo,
          isActive: true,
          ...(check
            ? {
                checkDamaged: check.checkDamaged,
                checkDeteriorated: check.checkDeteriorated,
                checkLost: check.checkLost,
                checkUnused: check.checkUnused,
                checkInUse: check.checkInUse,
                checkRemark: check.checkRemark,
              }
            : {}),
        };

        if (row.commitAction === "UPDATE" && row.matchedAssetId) {
          await tx.asset.update({
            where: { id: row.matchedAssetId },
            data: payload,
          });
        } else {
          await tx.asset.upsert({
            where: { assetCode: row.assetCode },
            update: payload,
            create: payload,
          });
        }

        await tx.importStagingRow.update({
          where: { id: row.id },
          data: { status: "COMMITTED" },
        });
        committed += 1;
      }
    });
  }

  const updated = await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: "COMMITTED",
      committedRows: committed,
      committedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "IMPORT_COMMIT",
      entity: "ImportBatch",
      entityId: batchId,
      detail: `นำเข้าสำเร็จ ${committed} รายการ (${batch.assetClass})`,
    },
  });

  return updated;
}
