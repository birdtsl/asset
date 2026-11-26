import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { nextLifecycleDocNo, toDateOnly } from "@/lib/lifecycle/doc-no";

export const maintenanceSchema = z.object({
  assetId: z.string().optional().nullable(),
  landId: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  requestDate: z.string().min(1),
  cost: z.number().nonnegative().optional().default(0),
  vendorName: z.string().optional().nullable(),
  requestedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const transferSchema = z.object({
  assetId: z.string().min(1),
  toDepartmentId: z.string().optional().nullable(),
  toLocationText: z.string().min(1),
  transferDate: z.string().min(1),
  reason: z.string().optional().nullable(),
});

export const disposalSchema = z.object({
  assetId: z.string().min(1),
  method: z.enum(["SALE", "DONATION", "DESTROY", "TRANSFER_OUT", "OTHER"]),
  disposalDate: z.string().min(1),
  reason: z.string().optional().nullable(),
  approvedValue: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createMaintenance(
  input: z.infer<typeof maintenanceSchema>,
  userId: string,
) {
  const data = maintenanceSchema.parse(input);
  if (!data.assetId && !data.landId) {
    throw new Error("ต้องระบุครุภัณฑ์หรือที่ดินอย่างน้อย 1 รายการ");
  }
  const docNo = await nextLifecycleDocNo("MT");
  return prisma.maintenanceOrder.create({
    data: {
      docNo,
      assetId: data.assetId || null,
      landId: data.landId || null,
      title: data.title,
      description: data.description || null,
      requestDate: toDateOnly(data.requestDate),
      cost: new Prisma.Decimal(data.cost ?? 0),
      vendorName: data.vendorName || null,
      requestedBy: data.requestedBy || null,
      notes: data.notes || null,
      status: "OPEN",
      createdById: userId,
    },
  });
}

export async function completeMaintenance(id: string, userId: string) {
  const order = await prisma.maintenanceOrder.findUnique({ where: { id } });
  if (!order) throw new Error("ไม่พบใบซ่อมบำรุง");
  if (order.status === "COMPLETED" || order.status === "CANCELLED") {
    throw new Error("เอกสารนี้ปิดงานแล้ว");
  }
  const updated = await prisma.maintenanceOrder.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedDate: toDateOnly(new Date()),
      performedBy: userId,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: "MAINTENANCE_COMPLETE",
      entity: "MaintenanceOrder",
      entityId: id,
      detail: `ปิดงานซ่อมบำรุง ${order.docNo}`,
    },
  });
  return updated;
}

export async function createTransfer(
  input: z.infer<typeof transferSchema>,
  userId: string,
) {
  const data = transferSchema.parse(input);
  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset || !asset.isActive) throw new Error("ไม่พบครุภัณฑ์หรือถูกจำหน่ายแล้ว");

  const docNo = await nextLifecycleDocNo("TR");
  return prisma.assetTransfer.create({
    data: {
      docNo,
      assetId: data.assetId,
      fromDepartmentId: asset.departmentId,
      toDepartmentId: data.toDepartmentId || null,
      fromLocationText: asset.locationText,
      toLocationText: data.toLocationText,
      transferDate: toDateOnly(data.transferDate),
      reason: data.reason || null,
      status: "DRAFT",
      createdById: userId,
    },
  });
}

export async function completeTransfer(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.assetTransfer.findUnique({ where: { id } });
    if (!transfer) throw new Error("ไม่พบใบโอนย้าย");
    if (transfer.status === "COMPLETED" || transfer.status === "CANCELLED") {
      throw new Error("เอกสารนี้ดำเนินการแล้ว");
    }

    await tx.asset.update({
      where: { id: transfer.assetId },
      data: {
        departmentId: transfer.toDepartmentId,
        locationText: transfer.toLocationText,
      },
    });

    const updated = await tx.assetTransfer.update({
      where: { id },
      data: {
        status: "COMPLETED",
        approvedById: userId,
        approvedAt: new Date(),
        completedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "ASSET_TRANSFER_COMPLETE",
        entity: "AssetTransfer",
        entityId: id,
        detail: `โอนย้าย ${transfer.docNo} ไปยัง ${transfer.toLocationText}`,
      },
    });

    return updated;
  });
}

export async function createDisposal(
  input: z.infer<typeof disposalSchema>,
  userId: string,
) {
  const data = disposalSchema.parse(input);
  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset || !asset.isActive) throw new Error("ไม่พบครุภัณฑ์หรือถูกจำหน่ายแล้ว");

  const docNo = await nextLifecycleDocNo("DS");
  return prisma.assetDisposal.create({
    data: {
      docNo,
      assetId: data.assetId,
      method: data.method,
      disposalDate: toDateOnly(data.disposalDate),
      reason: data.reason || null,
      approvedValue:
        data.approvedValue != null
          ? new Prisma.Decimal(data.approvedValue)
          : null,
      notes: data.notes || null,
      status: "DRAFT",
      createdById: userId,
    },
  });
}

export async function completeDisposal(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const disposal = await tx.assetDisposal.findUnique({ where: { id } });
    if (!disposal) throw new Error("ไม่พบใบจำหน่าย");
    if (disposal.status === "COMPLETED" || disposal.status === "CANCELLED") {
      throw new Error("เอกสารนี้ดำเนินการแล้ว");
    }

    const disposedStatus = await tx.assetStatus.findUnique({
      where: { code: "DISPOSED" },
    });

    await tx.asset.update({
      where: { id: disposal.assetId },
      data: {
        isActive: false,
        statusId: disposedStatus?.id ?? undefined,
      },
    });

    const updated = await tx.assetDisposal.update({
      where: { id },
      data: {
        status: "COMPLETED",
        approvedById: userId,
        approvedAt: new Date(),
        completedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "ASSET_DISPOSAL_COMPLETE",
        entity: "AssetDisposal",
        entityId: id,
        detail: `จำหน่ายครุภัณฑ์ ${disposal.docNo} วิธี ${disposal.method}`,
      },
    });

    return updated;
  });
}
