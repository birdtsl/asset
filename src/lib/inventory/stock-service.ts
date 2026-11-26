import { Prisma, type StockDocStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

function bangkokDateOnly(input?: string | Date) {
  if (!input) {
    const now = new Date();
    return new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
  }
  if (input instanceof Date) {
    return new Date(
      Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()),
    );
  }
  const [y, m, d] = input.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function nextDocNo(prefix: "RC" | "IS") {
  const now = new Date();
  const y = now.toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
  });
  const m = now.toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    month: "2-digit",
  });
  const d = now.toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
  });
  const stamp = `${y}${m}${d}`;
  const like = `${prefix}-${stamp}-%`;

  const latest =
    prefix === "RC"
      ? await prisma.stockReceipt.findFirst({
          where: { docNo: { startsWith: `${prefix}-${stamp}-` } },
          orderBy: { docNo: "desc" },
          select: { docNo: true },
        })
      : await prisma.stockIssue.findFirst({
          where: { docNo: { startsWith: `${prefix}-${stamp}-` } },
          orderBy: { docNo: "desc" },
          select: { docNo: true },
        });

  let seq = 1;
  if (latest?.docNo) {
    const part = latest.docNo.split("-").pop();
    const n = Number(part);
    if (Number.isFinite(n)) seq = n + 1;
  }
  void like;
  return `${prefix}-${stamp}-${String(seq).padStart(4, "0")}`;
}

export const stockLineSchema = z.object({
  materialId: z.string().min(1),
  quantity: z.number().positive("จำนวนต้องมากกว่า 0"),
  unitCost: z.number().nonnegative().optional().default(0),
  notes: z.string().optional().nullable(),
  lotNo: z.string().optional().nullable(),
  expireDate: z.string().optional().nullable(),
});

export const receiptCreateSchema = z.object({
  warehouseId: z.string().min(1),
  receiptDate: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  refNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(stockLineSchema).min(1, "ต้องมีรายการอย่างน้อย 1 รายการ"),
});

export const issueCreateSchema = z.object({
  warehouseId: z.string().min(1),
  issueDate: z.string().min(1),
  departmentId: z.string().optional().nullable(),
  requestedBy: z.string().optional().nullable(),
  purpose: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      stockLineSchema.omit({ unitCost: true, lotNo: true, expireDate: true }),
    )
    .min(1, "ต้องมีรายการอย่างน้อย 1 รายการ"),
});

export async function createReceiptDraft(
  input: z.infer<typeof receiptCreateSchema>,
  userId: string,
) {
  const data = receiptCreateSchema.parse(input);
  const docNo = await nextDocNo("RC");

  return prisma.stockReceipt.create({
    data: {
      docNo,
      warehouseId: data.warehouseId,
      receiptDate: bangkokDateOnly(data.receiptDate),
      supplierId: data.supplierId || null,
      departmentId: data.departmentId || null,
      refNo: data.refNo || null,
      notes: data.notes || null,
      status: "DRAFT",
      createdById: userId,
      items: {
        create: data.items.map((item) => {
          const qty = item.quantity;
          const cost = item.unitCost ?? 0;
          return {
            materialId: item.materialId,
            quantity: new Prisma.Decimal(qty),
            unitCost: new Prisma.Decimal(cost),
            lineTotal: new Prisma.Decimal(Number((qty * cost).toFixed(2))),
            lotNo: item.lotNo || null,
            expireDate: item.expireDate
              ? bangkokDateOnly(item.expireDate)
              : null,
            notes: item.notes || null,
          };
        }),
      },
    },
    include: { items: true },
  });
}

export async function postReceipt(receiptId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const receipt = await tx.stockReceipt.findUnique({
      where: { id: receiptId },
      include: { items: true },
    });
    if (!receipt) throw new Error("ไม่พบใบรับเข้า");
    if (receipt.status !== "DRAFT") {
      throw new Error("ใบรับเข้านี้โพสต์แล้วหรือถูกยกเลิก");
    }
    if (receipt.items.length === 0) throw new Error("ไม่มีรายการในใบรับเข้า");

    for (const item of receipt.items) {
      const qty = Number(item.quantity);
      const cost = Number(item.unitCost);
      const balance = await tx.stockBalance.findUnique({
        where: {
          warehouseId_materialId: {
            warehouseId: receipt.warehouseId,
            materialId: item.materialId,
          },
        },
      });

      const prevQty = balance ? Number(balance.quantity) : 0;
      const prevAvg = balance ? Number(balance.avgCost) : 0;
      const newQty = prevQty + qty;
      const newAvg =
        newQty > 0
          ? Number(((prevQty * prevAvg + qty * cost) / newQty).toFixed(4))
          : cost;

      await tx.stockBalance.upsert({
        where: {
          warehouseId_materialId: {
            warehouseId: receipt.warehouseId,
            materialId: item.materialId,
          },
        },
        update: {
          quantity: new Prisma.Decimal(newQty),
          avgCost: new Prisma.Decimal(newAvg),
        },
        create: {
          warehouseId: receipt.warehouseId,
          materialId: item.materialId,
          quantity: new Prisma.Decimal(newQty),
          avgCost: new Prisma.Decimal(newAvg),
        },
      });

      await tx.stockLedger.create({
        data: {
          warehouseId: receipt.warehouseId,
          materialId: item.materialId,
          movementType: "RECEIPT",
          movementDate: receipt.receiptDate,
          quantity: new Prisma.Decimal(qty),
          unitCost: new Prisma.Decimal(cost),
          balanceAfter: new Prisma.Decimal(newQty),
          receiptId: receipt.id,
          refDocNo: receipt.docNo,
          createdById: userId,
          notes: item.notes,
        },
      });
    }

    const updated = await tx.stockReceipt.update({
      where: { id: receiptId },
      data: {
        status: "POSTED" satisfies StockDocStatus,
        postedAt: new Date(),
        postedById: userId,
      },
      include: { items: { include: { material: true } } },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "STOCK_RECEIPT_POST",
        entity: "StockReceipt",
        entityId: receiptId,
        detail: `โพสต์ใบรับเข้า ${receipt.docNo}`,
      },
    });

    return updated;
  });
}

export async function createIssueDraft(
  input: z.infer<typeof issueCreateSchema>,
  userId: string,
) {
  const data = issueCreateSchema.parse(input);
  const docNo = await nextDocNo("IS");

  // pre-check stock availability for UX (hard check again on post)
  for (const item of data.items) {
    const balance = await prisma.stockBalance.findUnique({
      where: {
        warehouseId_materialId: {
          warehouseId: data.warehouseId,
          materialId: item.materialId,
        },
      },
      include: { material: true },
    });
    const onHand = balance ? Number(balance.quantity) : 0;
    if (item.quantity > onHand) {
      throw new Error(
        `สต็อกไม่พอ: ${balance?.material.name ?? item.materialId} คงเหลือ ${onHand}`,
      );
    }
  }

  return prisma.stockIssue.create({
    data: {
      docNo,
      warehouseId: data.warehouseId,
      issueDate: bangkokDateOnly(data.issueDate),
      departmentId: data.departmentId || null,
      requestedBy: data.requestedBy || null,
      purpose: data.purpose || null,
      notes: data.notes || null,
      status: "DRAFT",
      createdById: userId,
      items: {
        create: await Promise.all(
          data.items.map(async (item) => {
            const balance = await prisma.stockBalance.findUnique({
              where: {
                warehouseId_materialId: {
                  warehouseId: data.warehouseId,
                  materialId: item.materialId,
                },
              },
            });
            const unitCost = balance ? Number(balance.avgCost) : 0;
            const qty = item.quantity;
            return {
              materialId: item.materialId,
              quantity: new Prisma.Decimal(qty),
              unitCost: new Prisma.Decimal(unitCost),
              lineTotal: new Prisma.Decimal(
                Number((qty * unitCost).toFixed(2)),
              ),
              notes: item.notes || null,
            };
          }),
        ),
      },
    },
    include: { items: true },
  });
}

export async function postIssue(issueId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const issue = await tx.stockIssue.findUnique({
      where: { id: issueId },
      include: {
        items: { include: { material: true } },
      },
    });
    if (!issue) throw new Error("ไม่พบใบจ่ายออก");
    if (issue.status !== "DRAFT") {
      throw new Error("ใบจ่ายออกนี้โพสต์แล้วหรือถูกยกเลิก");
    }
    if (issue.items.length === 0) throw new Error("ไม่มีรายการในใบจ่ายออก");

    for (const item of issue.items) {
      const qty = Number(item.quantity);
      const balance = await tx.stockBalance.findUnique({
        where: {
          warehouseId_materialId: {
            warehouseId: issue.warehouseId,
            materialId: item.materialId,
          },
        },
      });
      const onHand = balance ? Number(balance.quantity) : 0;
      if (qty > onHand) {
        throw new Error(
          `สต็อกไม่พอขณะโพสต์: ${item.material.name} คงเหลือ ${onHand}`,
        );
      }

      const unitCost = balance ? Number(balance.avgCost) : Number(item.unitCost);
      const newQty = onHand - qty;

      await tx.stockBalance.update({
        where: {
          warehouseId_materialId: {
            warehouseId: issue.warehouseId,
            materialId: item.materialId,
          },
        },
        data: {
          quantity: new Prisma.Decimal(newQty),
        },
      });

      await tx.stockIssueItem.update({
        where: { id: item.id },
        data: {
          unitCost: new Prisma.Decimal(unitCost),
          lineTotal: new Prisma.Decimal(Number((qty * unitCost).toFixed(2))),
        },
      });

      await tx.stockLedger.create({
        data: {
          warehouseId: issue.warehouseId,
          materialId: item.materialId,
          movementType: "ISSUE",
          movementDate: issue.issueDate,
          quantity: new Prisma.Decimal(-qty),
          unitCost: new Prisma.Decimal(unitCost),
          balanceAfter: new Prisma.Decimal(newQty),
          issueId: issue.id,
          refDocNo: issue.docNo,
          createdById: userId,
          notes: item.notes,
        },
      });
    }

    const updated = await tx.stockIssue.update({
      where: { id: issueId },
      data: {
        status: "POSTED",
        postedAt: new Date(),
        postedById: userId,
      },
      include: { items: { include: { material: true } } },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: "STOCK_ISSUE_POST",
        entity: "StockIssue",
        entityId: issueId,
        detail: `โพสต์ใบจ่ายออก ${issue.docNo}`,
      },
    });

    return updated;
  });
}
