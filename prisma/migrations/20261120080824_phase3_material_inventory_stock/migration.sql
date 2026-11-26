-- CreateTable
CREATE TABLE `warehouses` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `location_text` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `warehouses_code_key`(`code`),
    INDEX `warehouses_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `material_categories` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `parent_id` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `material_categories_code_key`(`code`),
    INDEX `material_categories_parent_id_idx`(`parent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materials` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `category_id` VARCHAR(191) NULL,
    `unit_id` VARCHAR(191) NULL,
    `min_stock` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `reorder_point` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `materials_code_key`(`code`),
    INDEX `materials_category_id_idx`(`category_id`),
    INDEX `materials_is_active_idx`(`is_active`),
    INDEX `materials_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_balances` (
    `id` VARCHAR(191) NOT NULL,
    `warehouse_id` VARCHAR(191) NOT NULL,
    `material_id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `avg_cost` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `stock_balances_quantity_idx`(`quantity`),
    UNIQUE INDEX `stock_balances_warehouse_id_material_id_key`(`warehouse_id`, `material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_receipts` (
    `id` VARCHAR(191) NOT NULL,
    `doc_no` VARCHAR(40) NOT NULL,
    `warehouse_id` VARCHAR(191) NOT NULL,
    `receipt_date` DATE NOT NULL,
    `supplier_id` VARCHAR(191) NULL,
    `department_id` VARCHAR(191) NULL,
    `ref_no` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `status` ENUM('DRAFT', 'POSTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `created_by_id` VARCHAR(191) NULL,
    `posted_by_id` VARCHAR(191) NULL,
    `posted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `stock_receipts_doc_no_key`(`doc_no`),
    INDEX `stock_receipts_warehouse_id_idx`(`warehouse_id`),
    INDEX `stock_receipts_receipt_date_idx`(`receipt_date`),
    INDEX `stock_receipts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_receipt_items` (
    `id` VARCHAR(191) NOT NULL,
    `receipt_id` VARCHAR(191) NOT NULL,
    `material_id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(18, 2) NOT NULL,
    `unit_cost` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `line_total` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `lot_no` VARCHAR(80) NULL,
    `expire_date` DATE NULL,
    `notes` VARCHAR(255) NULL,

    INDEX `stock_receipt_items_receipt_id_idx`(`receipt_id`),
    INDEX `stock_receipt_items_material_id_idx`(`material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_issues` (
    `id` VARCHAR(191) NOT NULL,
    `doc_no` VARCHAR(40) NOT NULL,
    `warehouse_id` VARCHAR(191) NOT NULL,
    `issue_date` DATE NOT NULL,
    `department_id` VARCHAR(191) NULL,
    `requested_by` VARCHAR(150) NULL,
    `purpose` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `status` ENUM('DRAFT', 'POSTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `created_by_id` VARCHAR(191) NULL,
    `posted_by_id` VARCHAR(191) NULL,
    `posted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `stock_issues_doc_no_key`(`doc_no`),
    INDEX `stock_issues_warehouse_id_idx`(`warehouse_id`),
    INDEX `stock_issues_issue_date_idx`(`issue_date`),
    INDEX `stock_issues_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_issue_items` (
    `id` VARCHAR(191) NOT NULL,
    `issue_id` VARCHAR(191) NOT NULL,
    `material_id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(18, 2) NOT NULL,
    `unit_cost` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `line_total` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `notes` VARCHAR(255) NULL,

    INDEX `stock_issue_items_issue_id_idx`(`issue_id`),
    INDEX `stock_issue_items_material_id_idx`(`material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_ledgers` (
    `id` VARCHAR(191) NOT NULL,
    `warehouse_id` VARCHAR(191) NOT NULL,
    `material_id` VARCHAR(191) NOT NULL,
    `movement_type` ENUM('RECEIPT', 'ISSUE', 'ADJUST_IN', 'ADJUST_OUT') NOT NULL,
    `movement_date` DATETIME(3) NOT NULL,
    `quantity` DECIMAL(18, 2) NOT NULL,
    `unit_cost` DECIMAL(18, 4) NOT NULL DEFAULT 0,
    `balance_after` DECIMAL(18, 2) NOT NULL,
    `receipt_id` VARCHAR(191) NULL,
    `issue_id` VARCHAR(191) NULL,
    `ref_doc_no` VARCHAR(40) NULL,
    `notes` VARCHAR(255) NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_ledgers_warehouse_id_material_id_movement_date_idx`(`warehouse_id`, `material_id`, `movement_date`),
    INDEX `stock_ledgers_movement_type_idx`(`movement_type`),
    INDEX `stock_ledgers_ref_doc_no_idx`(`ref_doc_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `material_categories` ADD CONSTRAINT `material_categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `material_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `material_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materials` ADD CONSTRAINT `materials_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_balances` ADD CONSTRAINT `stock_balances_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_balances` ADD CONSTRAINT `stock_balances_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_receipts` ADD CONSTRAINT `stock_receipts_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_receipts` ADD CONSTRAINT `stock_receipts_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_receipts` ADD CONSTRAINT `stock_receipts_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_receipts` ADD CONSTRAINT `stock_receipts_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_receipts` ADD CONSTRAINT `stock_receipts_posted_by_id_fkey` FOREIGN KEY (`posted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_receipt_items` ADD CONSTRAINT `stock_receipt_items_receipt_id_fkey` FOREIGN KEY (`receipt_id`) REFERENCES `stock_receipts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_receipt_items` ADD CONSTRAINT `stock_receipt_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_issues` ADD CONSTRAINT `stock_issues_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_issues` ADD CONSTRAINT `stock_issues_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_issues` ADD CONSTRAINT `stock_issues_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_issues` ADD CONSTRAINT `stock_issues_posted_by_id_fkey` FOREIGN KEY (`posted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_issue_items` ADD CONSTRAINT `stock_issue_items_issue_id_fkey` FOREIGN KEY (`issue_id`) REFERENCES `stock_issues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_issue_items` ADD CONSTRAINT `stock_issue_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledgers` ADD CONSTRAINT `stock_ledgers_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledgers` ADD CONSTRAINT `stock_ledgers_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledgers` ADD CONSTRAINT `stock_ledgers_receipt_id_fkey` FOREIGN KEY (`receipt_id`) REFERENCES `stock_receipts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledgers` ADD CONSTRAINT `stock_ledgers_issue_id_fkey` FOREIGN KEY (`issue_id`) REFERENCES `stock_issues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledgers` ADD CONSTRAINT `stock_ledgers_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
