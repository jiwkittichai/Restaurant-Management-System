-- AlterTable
ALTER TABLE `Order` ADD COLUMN `stockDeducted` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Ingredient` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `unit` VARCHAR(191) NOT NULL,
  `stock` DOUBLE NOT NULL DEFAULT 0,
  `minStock` DOUBLE NOT NULL DEFAULT 0,
  `costPerUnit` DOUBLE NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Ingredient_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Recipe` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `menuItemId` INTEGER NOT NULL,
  `ingredientId` INTEGER NOT NULL,
  `quantity` DOUBLE NOT NULL,
  UNIQUE INDEX `Recipe_menuItemId_ingredientId_key`(`menuItemId`, `ingredientId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StockMovement` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `ingredientId` INTEGER NOT NULL,
  `type` ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT') NOT NULL,
  `quantity` DOUBLE NOT NULL,
  `reference` VARCHAR(191) NULL,
  `note` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Recipe` ADD CONSTRAINT `Recipe_menuItemId_fkey` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Recipe` ADD CONSTRAINT `Recipe_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `Ingredient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
