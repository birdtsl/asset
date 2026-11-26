-- AlterTable
ALTER TABLE `assets` ADD COLUMN `qr_token` VARCHAR(64) NULL,
    ADD COLUMN `qr_generated_at` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `assets_qr_token_key` ON `assets`(`qr_token`);

-- CreateTable
CREATE TABLE `inspection_campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `year_be` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `status` ENUM('DRAFT', 'IN_PROGRESS', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `created_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `inspection_campaigns_year_be_idx`(`year_be`),
    INDEX `inspection_campaigns_status_idx`(`status`),
    UNIQUE INDEX `inspection_campaigns_year_be_title_key`(`year_be`, `title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inspection_items` (
    `id` VARCHAR(191) NOT NULL,
    `campaign_id` VARCHAR(191) NOT NULL,
    `asset_id` VARCHAR(191) NOT NULL,
    `result` ENUM('PENDING', 'PASS', 'FAIL', 'REPAIR_NEEDED', 'MISSING', 'DISPOSED') NOT NULL DEFAULT 'PENDING',
    `condition_note` TEXT NULL,
    `location_found` VARCHAR(255) NULL,
    `inspected_at` DATETIME(3) NULL,
    `inspected_by_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `inspection_items_result_idx`(`result`),
    INDEX `inspection_items_inspected_at_idx`(`inspected_at`),
    UNIQUE INDEX `inspection_items_campaign_id_asset_id_key`(`campaign_id`, `asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inspection_campaigns` ADD CONSTRAINT `inspection_campaigns_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_items` ADD CONSTRAINT `inspection_items_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `inspection_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_items` ADD CONSTRAINT `inspection_items_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspection_items` ADD CONSTRAINT `inspection_items_inspected_by_id_fkey` FOREIGN KEY (`inspected_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
