-- AlterTable
ALTER TABLE `orders` ADD COLUMN `city` VARCHAR(120) NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL;
