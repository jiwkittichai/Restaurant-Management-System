CREATE TABLE `MenuItemModifierGroup` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `menuItemId` INTEGER NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `required` BOOLEAN NOT NULL DEFAULT false,
  `minSelect` INTEGER NOT NULL DEFAULT 0,
  `maxSelect` INTEGER NOT NULL DEFAULT 1,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `MenuItemModifierGroup_menuItemId_name_key`(`menuItemId`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MenuItemModifier`
  ADD COLUMN `groupId` INTEGER NULL;

ALTER TABLE `MenuItemModifierGroup`
  ADD CONSTRAINT `MenuItemModifierGroup_menuItemId_fkey`
  FOREIGN KEY (`menuItemId`) REFERENCES `MenuItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `MenuItemModifier`
  ADD CONSTRAINT `MenuItemModifier_groupId_fkey`
  FOREIGN KEY (`groupId`) REFERENCES `MenuItemModifierGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
