import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prima.module'
import { WishlistController } from './wishlist.controller'
import { WishlistService } from './wishlist.service'
import { NotificationModule } from '../notification/notification.module'

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
