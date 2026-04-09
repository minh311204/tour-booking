import { Module } from '@nestjs/common'
import { BookingController } from './booking.controller'
import { BookingService } from './booking.service'
import { PrismaModule } from '../prisma/prima.module'
import { BookingExpirationService } from './booking-expiration.service'

@Module({
  imports: [PrismaModule],
  controllers: [BookingController],
  providers: [BookingService, BookingExpirationService],
})
export class BookingModule {}
