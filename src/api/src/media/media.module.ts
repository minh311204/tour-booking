import { Module } from '@nestjs/common'
import { MediaController } from './media.controller'
import { MediaUploadService } from './media-upload.service'

@Module({
  controllers: [MediaController],
  providers: [MediaUploadService],
  exports: [MediaUploadService],
})
export class MediaModule {}
