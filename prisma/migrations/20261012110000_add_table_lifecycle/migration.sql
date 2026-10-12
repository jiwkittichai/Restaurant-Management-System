-- Keep historical orders linked to tables while allowing tables to be removed
-- from active restaurant operations.
ALTER TABLE `RestaurantTable`
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX `RestaurantTable_restaurantId_active_idx`
    ON `RestaurantTable`(`restaurantId`, `active`);
