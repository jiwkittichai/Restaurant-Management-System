CREATE TABLE `PaymentSettings` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `restaurantId` INTEGER NOT NULL,
  `promptPayEnabled` BOOLEAN NOT NULL DEFAULT false,
  `promptPayMode` VARCHAR(191) NOT NULL DEFAULT 'MANUAL_QR',
  `promptPayAccountName` VARCHAR(191) NULL,
  `promptPayIdentifier` VARCHAR(191) NULL,
  `promptPayQrImageUrl` VARCHAR(191) NULL,
  `stripeEnabled` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PaymentSettings_restaurantId_key`(`restaurantId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PaymentSettings`
  ADD CONSTRAINT `PaymentSettings_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
