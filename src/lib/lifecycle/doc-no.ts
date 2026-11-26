import { prisma } from "@/lib/prisma";

type Prefix = "MT" | "TR" | "DS";

function bangkokStamp() {
  const now = new Date();
  const y = now.toLocaleString("en-CA", { timeZone: "Asia/Bangkok", year: "numeric" });
  const m = now.toLocaleString("en-CA", { timeZone: "Asia/Bangkok", month: "2-digit" });
  const d = now.toLocaleString("en-CA", { timeZone: "Asia/Bangkok", day: "2-digit" });
  return `${y}${m}${d}`;
}

export async function nextLifecycleDocNo(prefix: Prefix) {
  const stamp = bangkokStamp();
  const startsWith = `${prefix}-${stamp}-`;

  const latest =
    prefix === "MT"
      ? await prisma.maintenanceOrder.findFirst({
          where: { docNo: { startsWith } },
          orderBy: { docNo: "desc" },
          select: { docNo: true },
        })
      : prefix === "TR"
        ? await prisma.assetTransfer.findFirst({
            where: { docNo: { startsWith } },
            orderBy: { docNo: "desc" },
            select: { docNo: true },
          })
        : await prisma.assetDisposal.findFirst({
            where: { docNo: { startsWith } },
            orderBy: { docNo: "desc" },
            select: { docNo: true },
          });

  let seq = 1;
  if (latest?.docNo) {
    const n = Number(latest.docNo.split("-").pop());
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefix}-${stamp}-${String(seq).padStart(4, "0")}`;
}

export function toDateOnly(input: string | Date) {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getFullYear(), input.getMonth(), input.getDate()));
  }
  const [y, m, d] = input.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
