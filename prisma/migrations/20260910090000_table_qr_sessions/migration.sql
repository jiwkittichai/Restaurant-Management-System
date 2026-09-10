-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `guestId` VARCHAR(191) NULL,
    ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE `TableSession` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tableId` INTEGER NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `orderId` INTEGER NULL,
    `paused` BOOLEAN NOT NULL DEFAULT false,
    `billRequestedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TableSession_token_key`(`token`),
    UNIQUE INDEX `TableSession_orderId_key`(`orderId`),
    INDEX `TableSession_tableId_closedAt_idx`(`tableId`, `closedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QrSubmission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `requestId` VARCHAR(64) NOT NULL,
    `guestId` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `QrSubmission_sessionId_guestId_createdAt_idx`(`sessionId`, `guestId`, `createdAt`),
    UNIQUE INDEX `QrSubmission_sessionId_requestId_key`(`sessionId`, `requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TableSession` ADD CONSTRAINT `TableSession_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `RestaurantTable`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QrSubmission` ADD CONSTRAINT `QrSubmission_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `TableSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

