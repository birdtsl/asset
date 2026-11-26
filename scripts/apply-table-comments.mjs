import "dotenv/config";
import mariadb from "mariadb";
import fs from "fs";

const comments = {
  users: "ผู้ใช้งานระบบ TSL Smart Asset",
  roles: "บทบาทผู้ใช้ (RBAC)",
  permissions: "สิทธิ์การใช้งานระบบ",
  role_permissions: "ความสัมพันธ์บทบาทกับสิทธิ์",
  user_roles: "ความสัมพันธ์ผู้ใช้กับบทบาท",
  departments: "ข้อมูลหลักหน่วยงาน",
  locations: "ข้อมูลหลักสถานที่ตั้ง",
  asset_categories: "ข้อมูลหลักหมวด/ประเภทครุภัณฑ์",
  units: "ข้อมูลหลักหน่วยนับ",
  budget_sources: "ข้อมูลหลักแหล่งงบประมาณ",
  suppliers: "ข้อมูลหลักผู้ขาย/ผู้จำหน่าย",
  asset_statuses: "ข้อมูลหลักสถานะครุภัณฑ์",
  assets: "ทะเบียนครุภัณฑ์ปกติและต่ำกว่าเกณฑ์",
  import_batches: "ชุดงานนำเข้า Excel ทะเบียนครุภัณฑ์",
  import_staging_rows: "แถว Staging ของการนำเข้า Excel ก่อนยืนยัน",
  system_settings: "ค่าตั้งค่าระบบ",
  audit_logs: "บันทึกกิจกรรมผู้ใช้/ระบบ",
  warehouses: "คลังวัสดุ",
  material_categories: "หมวดหมู่วัสดุ",
  materials: "รายการวัสดุคงคลัง",
  stock_balances: "ยอดคงเหลือวัสดุแยกตามคลัง",
  stock_receipts: "เอกสารรับเข้าวัสดุ",
  stock_receipt_items: "รายการในใบรับเข้าวัสดุ",
  stock_issues: "เอกสารจ่ายออกวัสดุ",
  stock_issue_items: "รายการในใบจ่ายออกวัสดุ",
  stock_ledgers: "สมุดบัญชีความเคลื่อนไหวสต็อกวัสดุ",
  land_parcels: "ทะเบียนที่ดิน",
  maintenance_orders: "ใบงานซ่อมบำรุง",
  asset_transfers: "เอกสารโอนย้ายครุภัณฑ์",
  asset_disposals: "เอกสารจำหน่ายครุภัณฑ์",
  inspection_campaigns: "รอบตรวจครุภัณฑ์ประจำปี",
  inspection_items: "รายการตรวจในแต่ละรอบตรวจประจำปี",
  notifications: "การแจ้งเตือนภายในระบบ",
};

const u = new URL(process.env.DATABASE_URL);
const conn = await mariadb.createConnection({
  host: u.hostname,
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ""),
  charset: "utf8mb4",
});

await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

for (const [table, comment] of Object.entries(comments)) {
  // COMMENT value must be a string literal; escape quotes
  const safe = comment.replace(/'/g, "''");
  await conn.query(`ALTER TABLE \`${table}\` COMMENT = '${safe}'`);
}

const rows = await conn.query(`
  SELECT TABLE_NAME AS t, TABLE_COMMENT AS c
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
  ORDER BY TABLE_NAME
`);

fs.writeFileSync(
  "scripts/table-comments.json",
  JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? Number(v) : v), 2),
  "utf8",
);

const missing = rows.filter(
  (r) =>
    Object.prototype.hasOwnProperty.call(comments, r.t) &&
    (!r.c || !String(r.c).trim() || /เธ/.test(String(r.c))),
);

console.log(
  JSON.stringify(
    {
      applied: Object.keys(comments).length,
      sample: rows.filter((r) => comments[r.t]).slice(0, 6),
      problems: missing.map((r) => r.t),
    },
    null,
    2,
  ),
);

await conn.end();
