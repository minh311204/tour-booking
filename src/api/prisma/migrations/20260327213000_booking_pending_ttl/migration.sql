ALTER TABLE `Booking`
  ADD COLUMN `expiredAtUtc` DATETIME(3) NULL;

CREATE INDEX `Booking_status_expiredAtUtc_idx`
  ON `Booking`(`status`, `expiredAtUtc`);
