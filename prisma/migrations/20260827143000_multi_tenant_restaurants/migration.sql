CREATE TABLE `Restaurant` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `ownerId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Restaurant_slug_key`(`slug`),
  INDEX `Restaurant_ownerId_idx`(`ownerId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Restaurant` (`id`, `name`, `slug`, `updatedAt`)
VALUES (1, 'Default Restaurant', 'default-restaurant', CURRENT_TIMESTAMP(3));

ALTER TABLE `Product` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `Category` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `MenuItem` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `MenuItemModifierGroup` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `MenuItemModifier` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `RestaurantTable` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `Order` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `Payment` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `Ingredient` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `StockMovement` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `Employee` ADD COLUMN `restaurantId` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `AuditLog` ADD COLUMN `restaurantId` INTEGER NULL;

UPDATE `MenuItemModifierGroup` AS `groups`
INNER JOIN `MenuItem` ON `MenuItem`.`id` = `groups`.`menuItemId`
SET `groups`.`restaurantId` = `MenuItem`.`restaurantId`;

UPDATE `MenuItemModifier` AS `modifiers`
INNER JOIN `MenuItem` ON `MenuItem`.`id` = `modifiers`.`menuItemId`
SET `modifiers`.`restaurantId` = `MenuItem`.`restaurantId`;

UPDATE `Payment` AS `payments`
INNER JOIN `Order` ON `Order`.`id` = `payments`.`orderId`
SET `payments`.`restaurantId` = `Order`.`restaurantId`;

UPDATE `StockMovement` AS `movements`
INNER JOIN `Ingredient` ON `Ingredient`.`id` = `movements`.`ingredientId`
SET `movements`.`restaurantId` = `Ingredient`.`restaurantId`;

UPDATE `AuditLog`
LEFT JOIN `Employee` ON `Employee`.`id` = `AuditLog`.`employeeId`
SET `AuditLog`.`restaurantId` = COALESCE(`Employee`.`restaurantId`, 1);

UPDATE `Restaurant`
SET `ownerId` = (
  SELECT `Employee`.`id`
  FROM `Employee`
  INNER JOIN `EmployeeRole` ON `EmployeeRole`.`employeeId` = `Employee`.`id`
  WHERE `EmployeeRole`.`role` = 'OWNER'
  ORDER BY `Employee`.`id`
  LIMIT 1
)
WHERE `id` = 1;

ALTER TABLE `AuditLog` MODIFY `restaurantId` INTEGER NOT NULL;

ALTER TABLE `Product` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `Category` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `MenuItem` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `MenuItemModifierGroup` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `MenuItemModifier` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `RestaurantTable` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `Order` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `Payment` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `Ingredient` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `StockMovement` MODIFY `restaurantId` INTEGER NOT NULL;
ALTER TABLE `Employee` MODIFY `restaurantId` INTEGER NOT NULL;

DROP INDEX `Category_name_key` ON `Category`;
DROP INDEX `MenuItem_sku_key` ON `MenuItem`;
DROP INDEX `RestaurantTable_name_key` ON `RestaurantTable`;
DROP INDEX `Order_orderNumber_key` ON `Order`;
DROP INDEX `Order_queueNumber_key` ON `Order`;
DROP INDEX `Ingredient_name_key` ON `Ingredient`;

CREATE UNIQUE INDEX `Product_restaurantId_sku_key` ON `Product`(`restaurantId`, `sku`);
CREATE UNIQUE INDEX `Category_restaurantId_name_key` ON `Category`(`restaurantId`, `name`);
CREATE UNIQUE INDEX `MenuItem_restaurantId_sku_key` ON `MenuItem`(`restaurantId`, `sku`);
CREATE INDEX `MenuItemModifierGroup_restaurantId_idx` ON `MenuItemModifierGroup`(`restaurantId`);
CREATE INDEX `MenuItemModifier_restaurantId_idx` ON `MenuItemModifier`(`restaurantId`);
CREATE UNIQUE INDEX `RestaurantTable_restaurantId_name_key` ON `RestaurantTable`(`restaurantId`, `name`);
CREATE UNIQUE INDEX `Order_restaurantId_orderNumber_key` ON `Order`(`restaurantId`, `orderNumber`);
CREATE UNIQUE INDEX `Order_restaurantId_queueNumber_key` ON `Order`(`restaurantId`, `queueNumber`);
CREATE INDEX `Payment_restaurantId_idx` ON `Payment`(`restaurantId`);
CREATE UNIQUE INDEX `Ingredient_restaurantId_name_key` ON `Ingredient`(`restaurantId`, `name`);
CREATE INDEX `StockMovement_restaurantId_idx` ON `StockMovement`(`restaurantId`);
CREATE UNIQUE INDEX `Employee_restaurantId_username_key` ON `Employee`(`restaurantId`, `username`);
CREATE INDEX `AuditLog_restaurantId_idx` ON `AuditLog`(`restaurantId`);

ALTER TABLE `Product`
  ADD CONSTRAINT `Product_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Category`
  ADD CONSTRAINT `Category_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `MenuItem`
  ADD CONSTRAINT `MenuItem_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `MenuItemModifierGroup`
  ADD CONSTRAINT `MenuItemModifierGroup_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `MenuItemModifier`
  ADD CONSTRAINT `MenuItemModifier_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RestaurantTable`
  ADD CONSTRAINT `RestaurantTable_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Order`
  ADD CONSTRAINT `Order_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Payment`
  ADD CONSTRAINT `Payment_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Ingredient`
  ADD CONSTRAINT `Ingredient_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `StockMovement`
  ADD CONSTRAINT `StockMovement_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Employee`
  ADD CONSTRAINT `Employee_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_restaurantId_fkey`
  FOREIGN KEY (`restaurantId`) REFERENCES `Restaurant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Restaurant`
  ADD CONSTRAINT `Restaurant_ownerId_fkey`
  FOREIGN KEY (`ownerId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
