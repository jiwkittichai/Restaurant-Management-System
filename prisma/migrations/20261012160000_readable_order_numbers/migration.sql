CREATE TABLE `OrderNumberCounter` (
    `restaurantId` INTEGER NOT NULL,
    `businessDate` VARCHAR(10) NOT NULL,
    `orderSequence` INTEGER NOT NULL DEFAULT 0,
    `queueSequence` INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (`restaurantId`),
    CONSTRAINT `OrderNumberCounter_restaurantId_fkey` FOREIGN KEY (`restaurantId`)
      REFERENCES `Restaurant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Existing identifiers remain intact. Only new takeaway orders get a queue date.
ALTER TABLE `Order` ADD COLUMN `queueDate` VARCHAR(10) NULL;
CREATE INDEX `Order_restaurantId_queueNumber_idx` ON `Order` (`restaurantId`, `queueNumber`);
CREATE UNIQUE INDEX `Order_restaurantId_queueDate_queueNumber_key`
  ON `Order` (`restaurantId`, `queueDate`, `queueNumber`);
DROP INDEX `Order_restaurantId_queueNumber_key` ON `Order`;
