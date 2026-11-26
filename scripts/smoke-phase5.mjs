import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { createHash, randomBytes } from "crypto";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const parsed = new URL(url);
  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    charset: "utf8mb4",
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

function createQrToken(assetId) {
  const salt = randomBytes(8).toString("hex");
  return createHash("sha256")
    .update(`${assetId}:${salt}:${Date.now()}`)
    .digest("hex")
    .slice(0, 32);
}

async function main() {
  const missing = await prisma.asset.findMany({
    where: { isActive: true, qrToken: null },
    select: { id: true },
    take: 50,
  });

  for (const a of missing) {
    await prisma.asset.update({
      where: { id: a.id },
      data: { qrToken: createQrToken(a.id), qrGeneratedAt: new Date() },
    });
  }

  const admin = await prisma.user.findFirst({
    where: { username: "admin" },
    select: { id: true },
  });
  if (!admin) throw new Error("admin user not found");

  const yearBe = 2569;
  const title = `ตรวจครุภัณฑ์ประจำปี ${yearBe} (demo)`;
  const existing = await prisma.inspectionCampaign.findUnique({
    where: { yearBe_title: { yearBe, title } },
  });
  if (existing) {
    const sample = await prisma.asset.findFirst({
      where: { qrToken: { not: null } },
      select: { assetCode: true, qrToken: true },
    });
    console.log(
      JSON.stringify({
        ok: true,
        qrGenerated: missing.length,
        campaignId: existing.id,
        reused: true,
        sampleQr: sample?.qrToken
          ? `http://localhost:3000/q/${sample.qrToken}`
          : null,
      }),
    );
    return;
  }

  const campaign = await prisma.inspectionCampaign.create({
    data: {
      yearBe,
      title,
      startDate: new Date(Date.UTC(2026, 10, 1)),
      endDate: new Date(Date.UTC(2026, 11, 31)),
      status: "IN_PROGRESS",
      notes: "Phase 5 smoke demo",
      createdById: admin.id,
    },
  });

  const assets = await prisma.asset.findMany({
    where: { isActive: true, assetClass: "NORMAL" },
    select: { id: true },
    take: 100,
  });

  await prisma.inspectionItem.createMany({
    data: assets.map((a) => ({
      campaignId: campaign.id,
      assetId: a.id,
      result: "PENDING",
    })),
    skipDuplicates: true,
  });

  const items = await prisma.inspectionItem.findMany({
    where: { campaignId: campaign.id },
    take: 5,
  });
  for (const [i, item] of items.entries()) {
    await prisma.inspectionItem.update({
      where: { id: item.id },
      data: {
        result: i % 2 === 0 ? "PASS" : "REPAIR_NEEDED",
        conditionNote: "smoke test",
        inspectedAt: new Date(),
        inspectedById: admin.id,
      },
    });
  }

  const sample = await prisma.asset.findFirst({
    where: { qrToken: { not: null } },
    select: { assetCode: true, qrToken: true },
  });

  console.log(
    JSON.stringify({
      ok: true,
      qrGenerated: missing.length,
      campaignId: campaign.id,
      items: assets.length,
      sampleQr: sample?.qrToken
        ? `http://localhost:3000/q/${sample.qrToken}`
        : null,
      assetCode: sample?.assetCode,
    }),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
