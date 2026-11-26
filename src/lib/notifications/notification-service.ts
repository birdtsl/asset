import { prisma } from "@/lib/prisma";

type AlertSeed = {
  dedupeKey: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  category: string;
  href?: string;
};

async function upsertSystemAlert(alert: AlertSeed) {
  const existing = await prisma.notification.findUnique({
    where: { dedupeKey: alert.dedupeKey },
  });
  if (existing) {
    if (existing.isRead) return existing;
    return prisma.notification.update({
      where: { id: existing.id },
      data: {
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        href: alert.href || null,
      },
    });
  }
  return prisma.notification.create({
    data: {
      userId: null,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      category: alert.category,
      href: alert.href || null,
      dedupeKey: alert.dedupeKey,
    },
  });
}

/** Sync live operational alerts into notifications (no mock values). */
export async function refreshSystemNotifications() {
  const [
    lowStockRows,
    pendingInspection,
    openMaintenance,
    openTransfers,
    openDisposals,
    draftReceipts,
    draftIssues,
  ] = await Promise.all([
    prisma.$queryRaw<{ code: string; name: string; qty: unknown; threshold: unknown }[]>`
      SELECT m.code, m.name,
             SUM(sb.quantity) AS qty,
             GREATEST(m.min_stock, m.reorder_point) AS threshold
      FROM materials m
      INNER JOIN stock_balances sb ON sb.material_id = m.id
      WHERE m.is_active = 1
      GROUP BY m.id, m.code, m.name, m.min_stock, m.reorder_point
      HAVING SUM(sb.quantity) <= GREATEST(m.min_stock, m.reorder_point)
         AND GREATEST(m.min_stock, m.reorder_point) > 0
      LIMIT 20
    `,
    prisma.inspectionItem.count({
      where: { result: "PENDING", campaign: { status: "IN_PROGRESS" } },
    }),
    prisma.maintenanceOrder.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.assetTransfer.count({
      where: { status: { in: ["DRAFT", "APPROVED"] } },
    }),
    prisma.assetDisposal.count({
      where: { status: { in: ["DRAFT", "APPROVED"] } },
    }),
    prisma.stockReceipt.count({ where: { status: "DRAFT" } }),
    prisma.stockIssue.count({ where: { status: "DRAFT" } }),
  ]);

  const seeds: AlertSeed[] = [];

  for (const row of lowStockRows) {
    seeds.push({
      dedupeKey: `LOW_STOCK:${row.code}`,
      title: `สต็อกต่ำ: ${row.name}`,
      message: `คงเหลือ ${Number(row.qty).toLocaleString("th-TH")} (เกณฑ์ ${Number(row.threshold).toLocaleString("th-TH")})`,
      severity: "WARNING",
      category: "STOCK",
      href: "/inventory/materials",
    });
  }

  if (pendingInspection > 0) {
    seeds.push({
      dedupeKey: "INSPECTION:PENDING",
      title: "รายการค้างตรวจประจำปี",
      message: `มี ${pendingInspection.toLocaleString("th-TH")} รายการที่ยังไม่บันทึกผลตรวจ`,
      severity: pendingInspection > 100 ? "CRITICAL" : "WARNING",
      category: "INSPECTION",
      href: "/inspection",
    });
  }

  if (openMaintenance > 0) {
    seeds.push({
      dedupeKey: "MAINTENANCE:OPEN",
      title: "งานซ่อมบำรุงค้าง",
      message: `มี ${openMaintenance.toLocaleString("th-TH")} ใบงานที่ยังไม่เสร็จ`,
      severity: "WARNING",
      category: "MAINTENANCE",
      href: "/maintenance",
    });
  }

  if (openTransfers > 0) {
    seeds.push({
      dedupeKey: "TRANSFER:OPEN",
      title: "โอนย้ายรอดำเนินการ",
      message: `มี ${openTransfers.toLocaleString("th-TH")} เอกสารโอนย้ายที่ยังไม่เสร็จ`,
      severity: "INFO",
      category: "TRANSFER",
      href: "/transfers",
    });
  }

  if (openDisposals > 0) {
    seeds.push({
      dedupeKey: "DISPOSAL:OPEN",
      title: "จำหน่ายรอดำเนินการ",
      message: `มี ${openDisposals.toLocaleString("th-TH")} เอกสารจำหน่ายที่ยังไม่เสร็จ`,
      severity: "INFO",
      category: "DISPOSAL",
      href: "/disposals",
    });
  }

  if (draftReceipts > 0) {
    seeds.push({
      dedupeKey: "RECEIPT:DRAFT",
      title: "ใบรับเข้าแบบร่าง",
      message: `มี ${draftReceipts.toLocaleString("th-TH")} ใบรับเข้าที่ยังไม่โพสต์`,
      severity: "INFO",
      category: "INVENTORY",
      href: "/inventory/receipts",
    });
  }

  if (draftIssues > 0) {
    seeds.push({
      dedupeKey: "ISSUE:DRAFT",
      title: "ใบจ่ายออกแบบร่าง",
      message: `มี ${draftIssues.toLocaleString("th-TH")} ใบจ่ายออกที่ยังไม่โพสต์`,
      severity: "INFO",
      category: "INVENTORY",
      href: "/inventory/issues",
    });
  }

  for (const seed of seeds) {
    await upsertSystemAlert(seed);
  }

  return { synced: seeds.length };
}

export async function listNotifications(limit = 30) {
  await refreshSystemNotifications();
  return prisma.notification.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllNotificationsRead() {
  return prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function unreadNotificationCount() {
  return prisma.notification.count({ where: { isRead: false } });
}
