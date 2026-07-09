-- AlterTable
ALTER TABLE `Order`
  ADD COLUMN `type` ENUM('DINE_IN', 'TAKEAWAY') NOT NULL DEFAULT 'DINE_IN',
  ADD COLUMN `queueNumber` VARCHAR(191) NULL,
  ADD COLUMN `customerName` VARCHAR(191) NULL,
  ADD COLUMN `customerPhone` VARCHAR(191) NULL,
  ADD COLUMN `estimatedReadyAt` DATETIME(3) NULL,
  ADD COLUMN `pickedUpAt` DATETIME(3) NULL,
  ADD COLUMN `paymentStatus` ENUM('UNPAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID';

CREATE UNIQUE INDEX `Order_queueNumber_key` ON `Order`(`queueNumber`);

-- Preserve payment state for existing orders.
UPDATE `Order` o
INNER JOIN `Payment` p ON p.`orderId` = o.`id`
SET o.`paymentStatus` = 'PAID';

-- Legacy paid orders are already closed; represent that as served fulfillment.
UPDATE `Order` SET `status` = 'SERVED' WHERE `status` = 'PAID';
