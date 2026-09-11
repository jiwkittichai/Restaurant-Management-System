-- AlterTable
ALTER TABLE `AuditLog` ADD COLUMN `requestId` VARCHAR(36) NULL;

-- CreateIndex
CREATE INDEX `AuditLog_restaurantId_createdAt_idx` ON `AuditLog`(`restaurantId`, `createdAt`);
