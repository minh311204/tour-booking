import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prima.module'
import { LocationController } from './location.controller'
import { LocationService } from './location.service'

@Module({
  imports: [PrismaModule],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule {}