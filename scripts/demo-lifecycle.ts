import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  completeTransfer,
  createMaintenance,
  createTransfer,
} from "../src/lib/lifecycle/lifecycle-service";

async function main() {
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  const land = await prisma.landParcel.findFirst({
    where: { parcelNo: "สท.684" },
  });
  const asset = await prisma.asset.findFirst({ where: { isActive: true } });
  if (!admin || !land || !asset) throw new Error("missing seed data");

  const today = new Date().toISOString().slice(0, 10);
  const mt = await createMaintenance(
    {
      landId: land.id,
      title: "ตรวจสภาพที่ดินประจำปี",
      requestDate: today,
      cost: 0,
      requestedBy: "งานพัสดุ",
    },
    admin.id,
  );

  const tr = await createTransfer(
    {
      assetId: asset.id,
      toLocationText: "อาคารผู้ป่วยใน",
      transferDate: today,
      reason: "ทดสอบโอนย้าย Phase 4",
    },
    admin.id,
  );
  await completeTransfer(tr.id, admin.id);

  const moved = await prisma.asset.findUnique({ where: { id: asset.id } });
  console.log({
    maintenance: mt.docNo,
    transfer: tr.docNo,
    landCount: await prisma.landParcel.count(),
    assetCode: asset.assetCode,
    newLocation: moved?.locationText,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
