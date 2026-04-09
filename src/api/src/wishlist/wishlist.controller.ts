import { Controller, UseGuards } from '@nestjs/common'
import { TsRestHandler } from '@ts-rest/nest'
import { wishlistContract } from '../../../shared/contracts/wishlist.contract'
import { WishlistService } from './wishlist.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @TsRestHandler(wishlistContract.getMyWishlist)
  getMyWishlist(@CurrentUser() user: { id: number }) {
    return async () => {
      const body = await this.wishlistService.getMyWishlist(user.id)
      return { status: 200 as const, body }
    }
  }

  @TsRestHandler(wishlistContract.addToWishlist)
  addToWishlist(@CurrentUser() user: { id: number }) {
    return async ({ body }: { body: { tourId: number } }) => {
      const result = await this.wishlistService.addToWishlist(user.id, body.tourId)
      return { status: 201 as const, body: result }
    }
  }

  @TsRestHandler(wishlistContract.removeFromWishlist)
  removeFromWishlist(@CurrentUser() user: { id: number }) {
    return async ({ params }: { params: { tourId: string } }) => {
      const body = await this.wishlistService.removeFromWishlist(
        user.id,
        Number(params.tourId),
      )
      return { status: 200 as const, body }
    }
  }

  @TsRestHandler(wishlistContract.checkWishlist)
  checkWishlist(@CurrentUser() user: { id: number }) {
    return async ({ params }: { params: { tourId: string } }) => {
      const body = await this.wishlistService.checkWishlist(
        user.id,
        Number(params.tourId),
      )
      return { status: 200 as const, body }
    }
  }
}
