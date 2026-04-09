-- AlterTable (MySQL: dùng backticks, không dùng cú pháp PostgreSQL)
ALTER TABLE `Tour` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false;

-- Gán nổi bật cho tối đa 6 tour đầu (dữ liệu cũ) để khối Tour nổi bật có nội dung
UPDATE `Tour` t
INNER JOIN (
  SELECT `id` FROM `Tour` ORDER BY `id` ASC LIMIT 6
) s ON t.`id` = s.`id`
SET t.`isFeatured` = true;
