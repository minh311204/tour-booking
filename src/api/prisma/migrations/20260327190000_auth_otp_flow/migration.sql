-- CreateTable
CREATE TABLE `AuthOtp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `purpose` ENUM('LOGIN', 'REGISTER') NOT NULL,
    `otpHash` VARCHAR(191) NOT NULL,
    `payloadJson` TEXT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `verifiedAtUtc` DATETIME(3) NULL,
    `expiredAtUtc` DATETIME(3) NOT NULL,
    `createdAtUtc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuthOtp_email_purpose_expiredAtUtc_idx` ON `AuthOtp`(`email`, `purpose`, `expiredAtUtc`);

