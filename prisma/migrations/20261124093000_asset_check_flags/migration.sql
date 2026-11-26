ALTER TABLE `assets`
  ADD COLUMN `check_damaged` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `check_deteriorated` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `check_lost` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `check_unused` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `check_in_use` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `check_remark` TEXT NULL;