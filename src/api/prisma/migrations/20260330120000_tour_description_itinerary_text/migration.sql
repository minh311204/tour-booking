-- MySQL: Prisma default String maps to VARCHAR(191); long itinerary/tour copy needs TEXT.

ALTER TABLE `Tour` MODIFY `description` TEXT;
ALTER TABLE `TourItinerary` MODIFY `description` TEXT;
