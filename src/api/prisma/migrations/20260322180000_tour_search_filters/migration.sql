-- Tour: điểm khởi hành / điểm đến + dòng tour + phương tiện; TourSchedule: index ngày khởi hành

-- AlterTable
ALTER TABLE `Tour` ADD COLUMN `departureLocationId` INTEGER NULL,
    ADD COLUMN `destinationLocationId` INTEGER NULL,
    ADD COLUMN `tourLine` ENUM('PREMIUM', 'STANDARD', 'ECONOMY', 'GOOD_VALUE') NULL,
    ADD COLUMN `transportType` ENUM('BUS', 'FLIGHT', 'MIXED') NULL;

-- DataFill
UPDATE `Tour` SET `departureLocationId` = `locationId`, `destinationLocationId` = `locationId` WHERE `departureLocationId` IS NULL;

-- AlterTable
ALTER TABLE `Tour` MODIFY `departureLocationId` INTEGER NOT NULL,
    MODIFY `destinationLocationId` INTEGER NOT NULL;

-- DropForeignKey
ALTER TABLE `Tour` DROP FOREIGN KEY `Tour_locationId_fkey`;

-- AlterTable
ALTER TABLE `Tour` DROP COLUMN `locationId`;

-- AddForeignKey
ALTER TABLE `Tour` ADD CONSTRAINT `Tour_departureLocationId_fkey` FOREIGN KEY (`departureLocationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tour` ADD CONSTRAINT `Tour_destinationLocationId_fkey` FOREIGN KEY (`destinationLocationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX `Tour_departureLocationId_idx` ON `Tour`(`departureLocationId`);

-- CreateIndex
CREATE INDEX `Tour_destinationLocationId_idx` ON `Tour`(`destinationLocationId`);

-- CreateIndex
CREATE INDEX `Tour_tourLine_idx` ON `Tour`(`tourLine`);

-- CreateIndex
CREATE INDEX `Tour_transportType_idx` ON `Tour`(`transportType`);

-- CreateIndex
CREATE INDEX `Tour_basePrice_idx` ON `Tour`(`basePrice`);

-- CreateIndex
CREATE INDEX `TourSchedule_startDate_idx` ON `TourSchedule`(`startDate`);

-- CreateIndex
CREATE INDEX `TourSchedule_tourId_startDate_idx` ON `TourSchedule`(`tourId`, `startDate`);
