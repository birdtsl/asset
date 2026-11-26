-- CreateTable
CREATE TABLE `assets` (
    `id` VARCHAR(191) NOT NULL,
    `asset_class` ENUM('NORMAL', 'LOW_VALUE') NOT NULL,
    `asset_code` VARCHAR(120) NOT NULL,
    `type_code` VARCHAR(50) NULL,
    `acquire_seq` VARCHAR(50) NULL,
    `year_code` VARCHAR(20) NULL,
    `seq_no` INTEGER NULL,
    `category_name` VARCHAR(150) NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `useful_life_years` INTEGER NULL,
    `budget_type` VARCHAR(100) NULL,
    `acquire_method` VARCHAR(100) NULL,
    `brand_model` TEXT NULL,
    `location_text` VARCHAR(255) NULL,
    `document_ref` TEXT NULL,
    `receive_day` INTEGER NULL,
    `receive_month` VARCHAR(30) NULL,
    `receive_year_be` INTEGER NULL,
    `received_at` DATETIME(3) NULL,
    `quantity` DECIMAL(18, 2) NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(18, 2) NULL,
    `total_value` DECIMAL(18, 2) NULL,
    `unit_name` VARCHAR(50) NULL,
    `calculate_depreciation` BOOLEAN NOT NULL DEFAULT true,
    `vendor_name` VARCHAR(255) NULL,
    `vendor_address` TEXT NULL,
    `vendor_phone` VARCHAR(80) NULL,
    `category_id` VARCHAR(191) NULL,
    `department_id` VARCHAR(191) NULL,
    `location_id` VARCHAR(191) NULL,
    `budget_source_id` VARCHAR(191) NULL,
    `supplier_id` VARCHAR(191) NULL,
    `status_id` VARCHAR(191) NULL,
    `unit_id` VARCHAR(191) NULL,
    `source_batch_id` VARCHAR(191) NULL,
    `source_row_no` INTEGER NULL,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `assets_asset_code_key`(`asset_code`),
    INDEX `assets_asset_class_idx`(`asset_class`),
    INDEX `assets_category_name_idx`(`category_name`),
    INDEX `assets_item_name_idx`(`item_name`),
    INDEX `assets_location_text_idx`(`location_text`),
    INDEX `assets_budget_type_idx`(`budget_type`),
    INDEX `assets_is_active_idx`(`is_active`),
    INDEX `assets_received_at_idx`(`received_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_batches` (
    `id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `stored_path` VARCHAR(500) NOT NULL,
    `sheet_name` VARCHAR(100) NOT NULL DEFAULT 'Data',
    `asset_class` ENUM('NORMAL', 'LOW_VALUE') NOT NULL,
    `status` ENUM('UPLOADED', 'VALIDATED', 'COMMITTED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'UPLOADED',
    `total_rows` INTEGER NOT NULL DEFAULT 0,
    `valid_rows` INTEGER NOT NULL DEFAULT 0,
    `warning_rows` INTEGER NOT NULL DEFAULT 0,
    `error_rows` INTEGER NOT NULL DEFAULT 0,
    `committed_rows` INTEGER NOT NULL DEFAULT 0,
    `uploaded_by_id` VARCHAR(191) NULL,
    `validated_at` DATETIME(3) NULL,
    `committed_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `error_summary` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `import_batches_asset_class_idx`(`asset_class`),
    INDEX `import_batches_status_idx`(`status`),
    INDEX `import_batches_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_staging_rows` (
    `id` VARCHAR(191) NOT NULL,
    `batch_id` VARCHAR(191) NOT NULL,
    `row_no` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'VALID', 'WARNING', 'ERROR', 'COMMITTED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `raw_json` LONGTEXT NOT NULL,
    `asset_code` VARCHAR(120) NULL,
    `type_code` VARCHAR(50) NULL,
    `acquire_seq` VARCHAR(50) NULL,
    `year_code` VARCHAR(20) NULL,
    `seq_no` INTEGER NULL,
    `category_name` VARCHAR(150) NULL,
    `item_name` VARCHAR(255) NULL,
    `useful_life_years` INTEGER NULL,
    `budget_type` VARCHAR(100) NULL,
    `acquire_method` VARCHAR(100) NULL,
    `brand_model` TEXT NULL,
    `location_text` VARCHAR(255) NULL,
    `document_ref` TEXT NULL,
    `receive_day` INTEGER NULL,
    `receive_month` VARCHAR(30) NULL,
    `receive_year_be` INTEGER NULL,
    `quantity` DECIMAL(18, 2) NULL,
    `unit_price` DECIMAL(18, 2) NULL,
    `unit_name` VARCHAR(50) NULL,
    `calculate_depreciation` BOOLEAN NULL,
    `vendor_name` VARCHAR(255) NULL,
    `vendor_address` TEXT NULL,
    `vendor_phone` VARCHAR(80) NULL,
    `validation_errors` LONGTEXT NULL,
    `validation_warnings` LONGTEXT NULL,
    `commit_action` ENUM('CREATE', 'UPDATE', 'SKIP') NULL,
    `matched_asset_id` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `import_staging_rows_status_idx`(`status`),
    INDEX `import_staging_rows_asset_code_idx`(`asset_code`),
    UNIQUE INDEX `import_staging_rows_batch_id_row_no_key`(`batch_id`, `row_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `asset_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_budget_source_id_fkey` FOREIGN KEY (`budget_source_id`) REFERENCES `budget_sources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `asset_statuses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_source_batch_id_fkey` FOREIGN KEY (`source_batch_id`) REFERENCES `import_batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `import_batches` ADD CONSTRAINT `import_batches_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `import_staging_rows` ADD CONSTRAINT `import_staging_rows_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `import_batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
