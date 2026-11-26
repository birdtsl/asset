-- CreateTable
CREATE TABLE `land_parcels` (
    `id` VARCHAR(191) NOT NULL,
    `parcel_no` VARCHAR(50) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `plot_no` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `responsible_unit` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `donor_name` VARCHAR(200) NULL,
    `area_rai` INTEGER NOT NULL DEFAULT 0,
    `area_ngan` INTEGER NOT NULL DEFAULT 0,
    `area_sq_wah` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `area_text` VARCHAR(150) NULL,
    `book_value` DECIMAL(18, 2) NULL,
    `net_value` DECIMAL(18, 2) NULL,
    `acquired_at` DATETIME(3) NULL,
    `has_buildings` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `land_parcels_parcel_no_key`(`parcel_no`),
    INDEX `land_parcels_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maintenance_orders` (
    `id` VARCHAR(191) NOT NULL,
    `doc_no` VARCHAR(40) NOT NULL,
    `asset_id` VARCHAR(191) NULL,
    `land_id` VARCHAR(191) NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `request_date` DATE NOT NULL,
    `completed_date` DATE NULL,
    `cost` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `vendor_name` VARCHAR(200) NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `requested_by` VARCHAR(150) NULL,
    `performed_by` VARCHAR(150) NULL,
    `notes` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `maintenance_orders_doc_no_key`(`doc_no`),
    INDEX `maintenance_orders_status_idx`(`status`),
    INDEX `maintenance_orders_request_date_idx`(`request_date`),
    INDEX `maintenance_orders_asset_id_idx`(`asset_id`),
    INDEX `maintenance_orders_land_id_idx`(`land_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_transfers` (
    `id` VARCHAR(191) NOT NULL,
    `doc_no` VARCHAR(40) NOT NULL,
    `asset_id` VARCHAR(191) NOT NULL,
    `from_department_id` VARCHAR(191) NULL,
    `to_department_id` VARCHAR(191) NULL,
    `from_location_text` VARCHAR(255) NULL,
    `to_location_text` VARCHAR(255) NOT NULL,
    `transfer_date` DATE NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `created_by_id` VARCHAR(191) NULL,
    `approved_by_id` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `asset_transfers_doc_no_key`(`doc_no`),
    INDEX `asset_transfers_status_idx`(`status`),
    INDEX `asset_transfers_transfer_date_idx`(`transfer_date`),
    INDEX `asset_transfers_asset_id_idx`(`asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_disposals` (
    `id` VARCHAR(191) NOT NULL,
    `doc_no` VARCHAR(40) NOT NULL,
    `asset_id` VARCHAR(191) NOT NULL,
    `method` ENUM('SALE', 'DONATION', 'DESTROY', 'TRANSFER_OUT', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `disposal_date` DATE NOT NULL,
    `reason` TEXT NULL,
    `approved_value` DECIMAL(18, 2) NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `created_by_id` VARCHAR(191) NULL,
    `approved_by_id` VARCHAR(191) NULL,
    `approved_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `asset_disposals_doc_no_key`(`doc_no`),
    INDEX `asset_disposals_status_idx`(`status`),
    INDEX `asset_disposals_disposal_date_idx`(`disposal_date`),
    INDEX `asset_disposals_asset_id_idx`(`asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `maintenance_orders` ADD CONSTRAINT `maintenance_orders_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_orders` ADD CONSTRAINT `maintenance_orders_land_id_fkey` FOREIGN KEY (`land_id`) REFERENCES `land_parcels`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_orders` ADD CONSTRAINT `maintenance_orders_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_from_department_id_fkey` FOREIGN KEY (`from_department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_to_department_id_fkey` FOREIGN KEY (`to_department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_transfers` ADD CONSTRAINT `asset_transfers_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_disposals` ADD CONSTRAINT `asset_disposals_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_disposals` ADD CONSTRAINT `asset_disposals_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_disposals` ADD CONSTRAINT `asset_disposals_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
