CREATE TABLE `Employee` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(191) NOT NULL,
  `displayName` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `lastLoginAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Employee_username_key`(`username`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeeRole` (
  `employeeId` INTEGER NOT NULL,
  `role` ENUM('OWNER', 'CASHIER', 'KITCHEN', 'STOCK') NOT NULL,
  PRIMARY KEY (`employeeId`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuthSession` (
  `tokenHash` VARCHAR(191) NOT NULL,
  `employeeId` INTEGER NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuthSession_employeeId_idx`(`employeeId`),
  INDEX `AuthSession_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`tokenHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `employeeId` INTEGER NULL,
  `action` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191) NULL,
  `details` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuditLog_employeeId_idx`(`employeeId`),
  INDEX `AuditLog_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EmployeeRole`
  ADD CONSTRAINT `EmployeeRole_employeeId_fkey`
  FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AuthSession`
  ADD CONSTRAINT `AuthSession_employeeId_fkey`
  FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_employeeId_fkey`
  FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
