/*
  Warnings:

  - You are about to alter the column `oldStatus` on the `BookingStatusHistory` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.
  - You are about to alter the column `newStatus` on the `BookingStatusHistory` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RolePermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRole` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `status` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isRead` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `RolePermission` DROP FOREIGN KEY `RolePermission_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_userId_fkey`;

-- AlterTable
ALTER TABLE `Booking` MODIFY `bookingDateUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `BookingStatusHistory` MODIFY `oldStatus` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NULL,
    MODIFY `newStatus` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NULL,
    MODIFY `changedAtUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `ChatMessage` MODIFY `createdAtUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `ChatSession` MODIFY `startedAtUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Notification` MODIFY `isRead` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `createdAtUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Payment` MODIFY `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `Tour` MODIFY `createdAtUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `User` ADD COLUMN `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    MODIFY `emailVerified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `UserBehavior` MODIFY `createdAtUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `Wishlist` MODIFY `createdAtUtc` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- DropTable
DROP TABLE `Role`;

-- DropTable
DROP TABLE `RolePermission`;

-- DropTable
DROP TABLE `UserRole`;

-- CreateIndex
CREATE INDEX `BlacklistedAccessToken_userId_idx` ON `BlacklistedAccessToken`(`userId`);

-- CreateIndex
CREATE INDEX `Wishlist_userId_idx` ON `Wishlist`(`userId`);

-- RenameIndex
ALTER TABLE `Booking` RENAME INDEX `Booking_userId_fkey` TO `Booking_userId_idx`;

-- RenameIndex
ALTER TABLE `Notification` RENAME INDEX `Notification_userId_fkey` TO `Notification_userId_idx`;

-- RenameIndex
ALTER TABLE `Payment` RENAME INDEX `Payment_bookingId_fkey` TO `Payment_bookingId_idx`;

-- RenameIndex
ALTER TABLE `ResetPasswordToken` RENAME INDEX `ResetPasswordToken_userId_fkey` TO `ResetPasswordToken_userId_idx`;
