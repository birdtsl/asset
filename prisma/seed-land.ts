import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "@prisma/client";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const parsed = new URL(url);
  return new PrismaClient({
    adapter: new PrismaMariaDb({
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ""),
      charset: "utf8mb4",
      collation: "utf8mb4_unicode_ci",
      initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    }),
  });
}

const prisma = createClient();

const parcels = [
  {
    parcelNo: "สท.684",
    title: "ที่ราชพัสดุ ที่ สท. 684",
    plotNo: "แปลงที่ 1",
    address: "322 หมู่ 8 ต.ทุ่งเสลี่ยม อ.ทุ่งเสลี่ยม จ.สุโขทัย",
    responsibleUnit: "โรงพยาบาลทุ่งเสลี่ยม สำนักงานปลัดกระทรวงสาธารณสุข",
    phone: "055-659175",
    areaRai: 13,
    areaNgan: 1,
    areaSqWah: 66,
    areaText: "13 ไร่ 1 งาน 66 ตารางวา",
    bookValue: null as number | null,
    hasBuildings: false,
    notes: null as string | null,
    acquiredAt: new Date("2024-06-15"),
  },
  {
    parcelNo: "สท.685",
    title: "ที่ราชพัสดุ ที่ สท. 685",
    plotNo: "แปลงที่ 1",
    address: "322 หมู่ 8 ต.ทุ่งเสลี่ยม อ.ทุ่งเสลี่ยม จ.สุโขทัย",
    responsibleUnit: "โรงพยาบาลทุ่งเสลี่ยม สำนักงานปลัดกระทรวงสาธารณสุข",
    phone: "055-659175",
    areaRai: 0,
    areaNgan: 2,
    areaSqWah: 51,
    areaText: "2 งาน 51 ตารางวา",
    bookValue: 31500,
    hasBuildings: true,
    notes: "มีสิ่งปลูกสร้าง จำนวน 3 รายการ",
    acquiredAt: new Date("2024-06-15"),
  },
  {
    parcelNo: "สท.947",
    title: "ที่ราชพัสดุ ที่ สท. 947",
    plotNo: "แปลงที่ 1",
    address: "9 หมู่ 1 ต.ทุ่งเสลี่ยม อ.ทุ่งเสลี่ยม จ.สุโขทัย",
    responsibleUnit: "คลินิคหมอครอบครัว โรงพยาบาลทุ่งเสลี่ยม",
    phone: "055-659412",
    areaRai: 1,
    areaNgan: 0,
    areaSqWah: 0,
    areaText: "1 ไร่",
    bookValue: null,
    hasBuildings: true,
    notes: "ปลูกสร้างในพื้นที่เทศบาลตำบลทุ่งเสลี่ยม",
    acquiredAt: new Date("2019-01-01"),
  },
  {
    parcelNo: "สท.656",
    title: "ที่ราชพัสดุ ที่ สท. 656",
    plotNo: "แปลงที่ 1",
    address: "ต.เขาแก้วศรีสมบูรณ์ อ.ทุ่งเสลี่ยม จ.สุโขทัย",
    responsibleUnit: "โรงพยาบาลทุ่งเสลี่ยม สำนักงานปลัดกระทรวงสาธารณสุข",
    phone: "055-659175",
    donorName: "นางสุพร้อม ชัยกูล",
    areaRai: 43,
    areaNgan: 1,
    areaSqWah: 81,
    areaText: "43 ไร่ 1 งาน 81 ตารางวา",
    bookValue: 10776220,
    hasBuildings: false,
    notes: null,
    acquiredAt: new Date("2026-08-14"),
  },
];

async function main() {
  console.log("Seeding land parcels from ทะเบียนคุมที่ดิน...");
  for (const p of parcels) {
    await prisma.landParcel.upsert({
      where: { parcelNo: p.parcelNo },
      update: {
        title: p.title,
        plotNo: p.plotNo,
        address: p.address,
        responsibleUnit: p.responsibleUnit,
        phone: p.phone,
        donorName: p.donorName ?? null,
        areaRai: p.areaRai,
        areaNgan: p.areaNgan,
        areaSqWah: new Prisma.Decimal(p.areaSqWah),
        areaText: p.areaText,
        bookValue:
          p.bookValue != null ? new Prisma.Decimal(p.bookValue) : null,
        netValue:
          p.bookValue != null ? new Prisma.Decimal(p.bookValue) : null,
        hasBuildings: p.hasBuildings,
        notes: p.notes,
        acquiredAt: p.acquiredAt,
      },
      create: {
        parcelNo: p.parcelNo,
        title: p.title,
        plotNo: p.plotNo,
        address: p.address,
        responsibleUnit: p.responsibleUnit,
        phone: p.phone,
        donorName: p.donorName ?? null,
        areaRai: p.areaRai,
        areaNgan: p.areaNgan,
        areaSqWah: new Prisma.Decimal(p.areaSqWah),
        areaText: p.areaText,
        bookValue:
          p.bookValue != null ? new Prisma.Decimal(p.bookValue) : null,
        netValue:
          p.bookValue != null ? new Prisma.Decimal(p.bookValue) : null,
        hasBuildings: p.hasBuildings,
        notes: p.notes,
        acquiredAt: p.acquiredAt,
      },
    });
  }
  console.log("Land parcels seeded:", parcels.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
