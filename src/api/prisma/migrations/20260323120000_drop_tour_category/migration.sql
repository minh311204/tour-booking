-- Bỏ TourCategory và cột categoryId trên Tour (đã xóa model trong schema)

-- DropForeignKey
ALTER TABLE `Tour` DROP FOREIGN KEY `Tour_categoryId_fkey`;

-- AlterTable
ALTER TABLE `Tour` DROP COLUMN `categoryId`;

-- DropTable
DROP TABLE `TourCategory`;
