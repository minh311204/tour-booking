import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { BookingService } from './booking.service'

@Injectable()
export class BookingExpirationService {
  private readonly log = new Logger(BookingExpirationService.name)

  constructor(private readonly bookingService: BookingService) {}

  @Interval(60_000)
  async expirePendingBookingsJob() {
    const result = await this.bookingService.expirePendingBookings()
    if (result.expiredCount > 0) {
      this.log.log(
        `Auto-cancelled ${result.expiredCount}/${result.scanned} expired pending bookings`,
      )
    }
  }
}

