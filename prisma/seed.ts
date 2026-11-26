import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hash } from "bcryptjs";

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
    collation: "utf8mb4_unicode_ci",
    initSql: "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

const permissionDefs = [
  { code: "dashboard.view", name: "ดูแดชบอร์ด", module: "dashboard" },
  { code: "users.view", name: "ดูผู้ใช้งาน", module: "users" },
  { code: "users.manage", name: "จัดการผู้ใช้งาน", module: "users" },
  { code: "roles.view", name: "ดูบทบาท", module: "roles" },
  { code: "roles.manage", name: "จัดการบทบาท", module: "roles" },
  { code: "master.view", name: "ดูข้อมูลหลัก", module: "master" },
  { code: "master.manage", name: "จัดการข้อมูลหลัก", module: "master" },
  { code: "assets.view", name: "ดูครุภัณฑ์", module: "assets" },
  { code: "assets.manage", name: "จัดการครุภัณฑ์", module: "assets" },
  { code: "assets.import", name: "นำเข้าครุภัณฑ์", module: "assets" },
  { code: "inventory.view", name: "ดูวัสดุคงคลัง", module: "inventory" },
  { code: "inventory.manage", name: "จัดการวัสดุคงคลัง", module: "inventory" },
  { code: "land.view", name: "ดูที่ดิน", module: "land" },
  { code: "land.manage", name: "จัดการที่ดิน", module: "land" },
  { code: "maintenance.view", name: "ดูซ่อมบำรุง", module: "maintenance" },
  { code: "maintenance.manage", name: "จัดการซ่อมบำรุง", module: "maintenance" },
  { code: "reports.view", name: "ดูรายงาน", module: "reports" },
  { code: "settings.manage", name: "ตั้งค่าระบบ", module: "settings" },
  { code: "audit.view", name: "ดูบันทึกกิจกรรม", module: "audit" },
] as const;

const roleDefs = [
  {
    code: "SUPER_ADMIN",
    name: "ผู้ดูแลระบบสูงสุด",
    description: "สิทธิ์เต็มระบบ",
    isSystem: true,
    permissions: [] as string[],
  },
  {
    code: "ADMIN",
    name: "ผู้ดูแลระบบ",
    description: "บริหารผู้ใช้ ข้อมูลหลัก และการตั้งค่า",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "users.view",
      "users.manage",
      "roles.view",
      "roles.manage",
      "master.view",
      "master.manage",
      "assets.view",
      "inventory.view",
      "land.view",
      "maintenance.view",
      "reports.view",
      "settings.manage",
      "audit.view",
    ],
  },
  {
    code: "ASSET_OFFICER",
    name: "เจ้าหน้าที่พัสดุ/ครุภัณฑ์",
    description: "จัดการทะเบียนครุภัณฑ์",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "assets.view",
      "assets.manage",
      "assets.import",
      "land.view",
      "maintenance.view",
      "maintenance.manage",
      "reports.view",
    ],
  },
  {
    code: "WAREHOUSE",
    name: "เจ้าหน้าที่คลังวัสดุ",
    description: "รับ-จ่ายวัสดุคงคลัง",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "inventory.view",
      "inventory.manage",
      "reports.view",
    ],
  },
  {
    code: "DEPARTMENT_USER",
    name: "ผู้ใช้หน่วยงาน",
    description: "ดูข้อมูลหน่วยงานตนเอง",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "assets.view",
      "inventory.view",
      "maintenance.view",
    ],
  },
  {
    code: "VIEWER",
    name: "ผู้ดูอย่างเดียว",
    description: "ดูข้อมูลอย่างเดียว",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "master.view",
      "assets.view",
      "inventory.view",
      "land.view",
      "maintenance.view",
      "reports.view",
    ],
  },
  {
    code: "EXECUTIVE",
    name: "ผู้บริหาร",
    description: "แดชบอร์ดและรายงานระดับบริหาร",
    isSystem: true,
    permissions: ["dashboard.view", "reports.view", "audit.view"],
  },
] as const;

async function main() {
  console.log("Seeding TSL Smart Asset (Phase 1)...");

  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, module: p.module },
      create: { code: p.code, name: p.name, module: p.module },
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  for (const role of roleDefs) {
    const saved = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });

    if (role.code === "SUPER_ADMIN") continue;

    await prisma.rolePermission.deleteMany({ where: { roleId: saved.id } });
    const rows = role.permissions
      .map((code) => permissionByCode.get(code))
      .filter((id): id is string => !!id)
      .map((permissionId) => ({ roleId: saved.id, permissionId }));

    if (rows.length > 0) {
      await prisma.rolePermission.createMany({ data: rows });
    }
  }

  const itDept = await prisma.department.upsert({
    where: { code: "IT" },
    update: { name: "งานเทคโนโลยีสารสนเทศ" },
    create: { code: "IT", name: "งานเทคโนโลยีสารสนเทศ" },
  });

  await prisma.department.upsert({
    where: { code: "SUPPLY" },
    update: { name: "งานพัสดุ" },
    create: { code: "SUPPLY", name: "งานพัสดุ" },
  });

  await prisma.department.upsert({
    where: { code: "ADMIN" },
    update: { name: "งานบริหารทั่วไป" },
    create: { code: "ADMIN", name: "งานบริหารทั่วไป" },
  });

  await prisma.location.upsert({
    where: { code: "MAIN-1F" },
    update: { name: "อาคารหลัก ชั้น 1" },
    create: {
      code: "MAIN-1F",
      name: "อาคารหลัก ชั้น 1",
      building: "อาคารหลัก",
      floor: "1",
      departmentId: itDept.id,
    },
  });

  for (const u of [
    { code: "UNIT", name: "หน่วย" },
    { code: "SET", name: "ชุด" },
    { code: "PCS", name: "ชิ้น" },
  ]) {
    await prisma.unit.upsert({
      where: { code: u.code },
      update: { name: u.name },
      create: u,
    });
  }

  for (const c of [
    { code: "MED", name: "ครุภัณฑ์การแพทย์" },
    { code: "OFFICE", name: "ครุภัณฑ์สำนักงาน" },
    { code: "IT", name: "ครุภัณฑ์คอมพิวเตอร์" },
    { code: "VEHICLE", name: "ยานพาหนะ" },
  ]) {
    await prisma.assetCategory.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: c,
    });
  }

  for (const b of [
    { code: "GOV", name: "งบประมาณแผ่นดิน" },
    { code: "UC", name: "งบประกันสุขภาพถ้วนหน้า" },
    { code: "DONATE", name: "เงินบริจาค" },
  ]) {
    await prisma.budgetSource.upsert({
      where: { code: b.code },
      update: { name: b.name },
      create: b,
    });
  }

  for (const s of [
    { code: "IN_USE", name: "ใช้งาน", sortOrder: 1, color: "green" },
    { code: "IDLE", name: "ไม่ได้ใช้งาน", sortOrder: 2, color: "amber" },
    { code: "REPAIR", name: "ส่งซ่อม", sortOrder: 3, color: "orange" },
    { code: "DISPOSED", name: "จำหน่ายแล้ว", sortOrder: 4, color: "slate" },
  ]) {
    await prisma.assetStatus.upsert({
      where: { code: s.code },
      update: { name: s.name, sortOrder: s.sortOrder, color: s.color },
      create: s,
    });
  }

  await prisma.supplier.upsert({
    where: { code: "GEN" },
    update: { name: "ผู้จำหน่ายทั่วไป" },
    create: { code: "GEN", name: "ผู้จำหน่ายทั่วไป" },
  });

  for (const s of [
    { key: "org.name", value: "โรงพยาบาลทุ่งเสลี่ยม", label: "ชื่อหน่วยงาน" },
    { key: "org.province", value: "สุโขทัย", label: "จังหวัด" },
    { key: "app.timezone", value: "Asia/Bangkok", label: "Timezone" },
    { key: "app.phase", value: "1", label: "Development Phase" },
    {
      key: "asset.low_value_threshold",
      value: "10000",
      label: "เกณฑ์ครุภัณฑ์ต่ำกว่าเกณฑ์ (บาท)",
    },
  ]) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, label: s.label },
      create: s,
    });
  }

  const passwordHash = await hash("Admin@1234", 12);
  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { code: "SUPER_ADMIN" },
  });

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      fullName: "ผู้ดูแลระบบ",
      passwordHash,
      status: "ACTIVE",
      departmentId: itDept.id,
    },
    create: {
      username: "admin",
      email: "admin@tsl.local",
      fullName: "ผู้ดูแลระบบ",
      passwordHash,
      status: "ACTIVE",
      departmentId: itDept.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: adminRole.id },
    },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED",
      entity: "System",
      detail: "Phase 1 seed completed",
    },
  });

  console.log("Seed completed.");
  console.log("Login: admin / Admin@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
