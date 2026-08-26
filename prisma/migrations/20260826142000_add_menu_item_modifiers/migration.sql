CREATE TABLE `MenuItemModifier` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `menuItemId` INTEGER NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `MenuItemModifier_menuItemId_name_key`(`menuItemId`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MenuItemModifierRecipe` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `modifierId` INTEGER NOT NULL,
  `ingredientId` INTEGER NOT NULL,
  `quantity` DOUBLE NOT NULL,

  UNIQUE INDEX `MenuItemModifierRecipe_modifierId_ingredientId_key`(`modifierId`, `ingredientId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OrderItemModifier` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `orderItemId` INTEGER NOT NULL,
  `modifierId` INTEGER NULL,
  `name` VARCHAR(191) NOT NULL,
  `price` DOUBLE NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MenuItemModifier`
  ADD CONSTRAINT `MenuItemModifier_menuItemId_fkey`
  FOREIGN KEY (`menuItemId`) REFERENCES `MenuItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `MenuItemModifierRecipe`
  ADD CONSTRAINT `MenuItemModifierRecipe_modifierId_fkey`
  FOREIGN KEY (`modifierId`) REFERENCES `MenuItemModifier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `MenuItemModifierRecipe`
  ADD CONSTRAINT `MenuItemModifierRecipe_ingredientId_fkey`
  FOREIGN KEY (`ingredientId`) REFERENCES `Ingredient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OrderItemModifier`
  ADD CONSTRAINT `OrderItemModifier_orderItemId_fkey`
  FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `OrderItemModifier`
  ADD CONSTRAINT `OrderItemModifier_modifierId_fkey`
  FOREIGN KEY (`modifierId`) REFERENCES `MenuItemModifier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
