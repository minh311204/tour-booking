import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prima.module'
import { TourController } from './tour.controller'
import { TourService } from './tour.service'
import { TourTagService } from './tour-tag.service'
import { TourMediaService } from './tour-media.service'
import { TourReviewService } from './tour-review.service'

@Module({
  imports: [PrismaModule],
  controllers: [TourController],
  providers: [TourService, TourTagService, TourMediaService, TourReviewService],
})
export class TourModule {}