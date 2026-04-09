-- AlterTable: Tour.name VARCHAR(191) → TEXT
-- Lý do: tên tour có thể dài hơn 191 ký tự (giới hạn mặc định của Prisma String trên MySQL)
ALTER TABLE `Tour` MODIFY COLUMN `name` TEXT NOT NULL;
