-- Thông tin liên lạc + ghi chú trên Booking; loại hành khách trên BookingPassenger

ALTER TABLE `Booking`
ADD COLUMN `contactFullName` VARCHAR(191) NULL,
ADD COLUMN `contactEmail` VARCHAR(191) NULL,
ADD COLUMN `contactPhone` VARCHAR(191) NULL,
ADD COLUMN `contactAddress` VARCHAR(191) NULL,
ADD COLUMN `notes` TEXT NULL;

ALTER TABLE `BookingPassenger`
ADD COLUMN `ageCategory` ENUM('ADULT', 'CHILD', 'INFANT') NOT NULL DEFAULT 'ADULT';
