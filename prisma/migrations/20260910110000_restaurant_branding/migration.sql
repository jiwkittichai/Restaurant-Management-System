-- AlterTable
ALTER TABLE `Restaurant` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `logoUrl` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `receiptFooter` VARCHAR(191) NULL,
    ADD COLUMN `welcomeMessage` VARCHAR(191) NULL;

