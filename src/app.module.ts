import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './api/src/auth/auth.module';
import { UsersModule } from './api/src/users/users.module';
import { LocationModule } from './api/src/location/location.module';
import { TourModule } from './api/src/tour/tour.module';
import { BookingModule } from './api/src/booking/booking.module';
import { PaymentModule } from './api/src/payment/payment.module';
import { AiModule } from './api/src/ai/ai.module';
import { SupplierModule } from './api/src/supplier/supplier.module';
import { NotificationModule } from './api/src/notification/notification.module';
import { WishlistModule } from './api/src/wishlist/wishlist.module';
import { PreferenceModule } from './api/src/preference/preference.module';
import { AdminModule } from './api/src/admin/admin.module';
import { MediaModule } from './api/src/media/media.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AdminModule,
    MediaModule,
    AuthModule,
    UsersModule,
    LocationModule,
    TourModule,
    BookingModule,
    PaymentModule,
    AiModule,
    SupplierModule,
    NotificationModule,
    WishlistModule,
    PreferenceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
