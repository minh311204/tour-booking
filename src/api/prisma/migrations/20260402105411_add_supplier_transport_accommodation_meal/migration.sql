-- DropForeignKey
ALTER TABLE `Booking` DROP FOREIGN KEY `Booking_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ChatSession` DROP FOREIGN KEY `ChatSession_userId_fkey`;

-- DropIndex
DROP INDEX `ChatSession_userId_fkey` ON `ChatSession`;

-- AlterTable
ALTER TABLE `BookingPassenger` ALTER COLUMN `ageCategory` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Tour` ADD COLUMN `cancellationPolicy` TEXT NULL,
    ADD COLUMN `exclusions` TEXT NULL,
    ADD COLUMN `inclusions` TEXT NULL;

-- CreateTable
CREATE TABLE `Supplier` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('TRANSPORT', 'HOTEL', 'RESTAURANT', 'GUIDE', 'ACTIVITY') NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `taxCode` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAtUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TourTransport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tourId` INTEGER NOT NULL,
    `supplierId` INTEGER NULL,
    `legOrder` INTEGER NOT NULL,
    `vehicleType` ENUM('CAR_4', 'CAR_7', 'BUS_16', 'BUS_29', 'BUS_45', 'FLIGHT', 'TRAIN', 'BOAT', 'CABLE_CAR') NOT NULL,
    `vehicleDetail` VARCHAR(191) NULL,
    `seatClass` VARCHAR(191) NULL,
    `departurePoint` VARCHAR(191) NOT NULL,
    `arrivalPoint` VARCHAR(191) NOT NULL,
    `estimatedHours` DECIMAL(65, 30) NULL,
    `notes` TEXT NULL,

    INDEX `TourTransport_tourId_idx`(`tourId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TourAccommodation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itineraryId` INTEGER NOT NULL,
    `supplierId` INTEGER NULL,
    `hotelName` VARCHAR(191) NOT NULL,
    `starRating` INTEGER NULL,
    `roomType` VARCHAR(191) NULL,
    `checkInNote` VARCHAR(191) NULL,
    `checkOutNote` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `mapUrl` VARCHAR(191) NULL,

    INDEX `TourAccommodation_itineraryId_idx`(`itineraryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TourMeal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itineraryId` INTEGER NOT NULL,
    `supplierId` INTEGER NULL,
    `mealType` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    `restaurantName` VARCHAR(191) NULL,
    `menuStyle` VARCHAR(191) NULL,
    `dietaryNotes` VARCHAR(191) NULL,

    INDEX `TourMeal_itineraryId_idx`(`itineraryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TourTransport` ADD CONSTRAINT `TourTransport_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourTransport` ADD CONSTRAINT `TourTransport_tourId_fkey` FOREIGN KEY (`tourId`) REFERENCES `Tour`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourAccommodation` ADD CONSTRAINT `TourAccommodation_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourAccommodation` ADD CONSTRAINT `TourAccommodation_itineraryId_fkey` FOREIGN KEY (`itineraryId`) REFERENCES `TourItinerary`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourMeal` ADD CONSTRAINT `TourMeal_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TourMeal` ADD CONSTRAINT `TourMeal_itineraryId_fkey` FOREIGN KEY (`itineraryId`) REFERENCES `TourItinerary`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatSession` ADD CONSTRAINT `ChatSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
