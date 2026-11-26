-- Table comments for tsl_asset (MariaDB)
-- อธิบายหน้าที่ของแต่ละตารางเป็นภาษาไทย

ALTER TABLE `users` COMMENT = 'ผู้ใช้งานระบบ TSL Smart Asset';
ALTER TABLE `roles` COMMENT = 'บทบาทผู้ใช้ (RBAC)';
ALTER TABLE `permissions` COMMENT = 'สิทธิ์การใช้งานระบบ';
ALTER TABLE `role_permissions` COMMENT = 'ความสัมพันธ์บทบาทกับสิทธิ์';
ALTER TABLE `user_roles` COMMENT = 'ความสัมพันธ์ผู้ใช้กับบทบาท';

ALTER TABLE `departments` COMMENT = 'ข้อมูลหลักหน่วยงาน';
ALTER TABLE `locations` COMMENT = 'ข้อมูลหลักสถานที่ตั้ง';
ALTER TABLE `asset_categories` COMMENT = 'ข้อมูลหลักหมวด/ประเภทครุภัณฑ์';
ALTER TABLE `units` COMMENT = 'ข้อมูลหลักหน่วยนับ';
ALTER TABLE `budget_sources` COMMENT = 'ข้อมูลหลักแหล่งงบประมาณ';
ALTER TABLE `suppliers` COMMENT = 'ข้อมูลหลักผู้ขาย/ผู้จำหน่าย';
ALTER TABLE `asset_statuses` COMMENT = 'ข้อมูลหลักสถานะครุภัณฑ์';

ALTER TABLE `assets` COMMENT = 'ทะเบียนครุภัณฑ์ปกติและต่ำกว่าเกณฑ์';
ALTER TABLE `import_batches` COMMENT = 'ชุดงานนำเข้า Excel ทะเบียนครุภัณฑ์';
ALTER TABLE `import_staging_rows` COMMENT = 'แถว Staging ของการนำเข้า Excel ก่อนยืนยัน';

ALTER TABLE `system_settings` COMMENT = 'ค่าตั้งค่าระบบ';
ALTER TABLE `audit_logs` COMMENT = 'บันทึกกิจกรรมผู้ใช้/ระบบ';

ALTER TABLE `warehouses` COMMENT = 'คลังวัสดุ';
ALTER TABLE `material_categories` COMMENT = 'หมวดหมู่วัสดุ';
ALTER TABLE `materials` COMMENT = 'รายการวัสดุคงคลัง';
ALTER TABLE `stock_balances` COMMENT = 'ยอดคงเหลือวัสดุแยกตามคลัง';
ALTER TABLE `stock_receipts` COMMENT = 'เอกสารรับเข้าวัสดุ';
ALTER TABLE `stock_receipt_items` COMMENT = 'รายการในใบรับเข้าวัสดุ';
ALTER TABLE `stock_issues` COMMENT = 'เอกสารจ่ายออกวัสดุ';
ALTER TABLE `stock_issue_items` COMMENT = 'รายการในใบจ่ายออกวัสดุ';
ALTER TABLE `stock_ledgers` COMMENT = 'สมุดบัญชีความเคลื่อนไหวสต็อกวัสดุ';

ALTER TABLE `land_parcels` COMMENT = 'ทะเบียนที่ดิน';
ALTER TABLE `maintenance_orders` COMMENT = 'ใบงานซ่อมบำรุง';
ALTER TABLE `asset_transfers` COMMENT = 'เอกสารโอนย้ายครุภัณฑ์';
ALTER TABLE `asset_disposals` COMMENT = 'เอกสารจำหน่ายครุภัณฑ์';

ALTER TABLE `inspection_campaigns` COMMENT = 'รอบตรวจครุภัณฑ์ประจำปี';
ALTER TABLE `inspection_items` COMMENT = 'รายการตรวจในแต่ละรอบตรวจประจำปี';
ALTER TABLE `notifications` COMMENT = 'การแจ้งเตือนภายในระบบ';
