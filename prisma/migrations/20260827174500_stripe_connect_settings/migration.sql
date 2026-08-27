ALTER TABLE `PaymentSettings`
  ADD COLUMN `stripeAccountId` VARCHAR(191) NULL,
  ADD COLUMN `stripeChargesEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `stripePayoutsEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `stripeDetailsSubmitted` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `PaymentSettings_stripeAccountId_idx` ON `PaymentSettings`(`stripeAccountId`);
