ALTER TABLE `ChatSession`
  MODIFY COLUMN `userId` INT NULL,
  ADD COLUMN `sessionKey` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `ChatSession_sessionKey_key` (`sessionKey`);

