import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { withExceptionResponse } from './helpers'
import {
  WishlistItemSchema,
  AddToWishlistSchema,
  WishlistCheckSchema,
} from '../schema/wishlist.schema'

const c = initContract()
const tourIdParams = z.object({ tourId: z.coerce.number().int() })

export const wishlistContract = c.router({
  getMyWishlist: {
    method: 'GET',
    path: '',
    responses: withExceptionResponse({
      200: z.array(WishlistItemSchema),
    }),
  },

  addToWishlist: {
    method: 'POST',
    path: '',
    body: AddToWishlistSchema,
    responses: withExceptionResponse({
      201: WishlistItemSchema,
    }),
  },

  removeFromWishlist: {
    method: 'DELETE',
    path: '/:tourId',
    pathParams: tourIdParams,
    responses: withExceptionResponse({
      200: z.object({ message: z.string() }),
    }),
  },

  checkWishlist: {
    method: 'GET',
    path: '/:tourId/check',
    pathParams: tourIdParams,
    responses: withExceptionResponse({
      200: WishlistCheckSchema,
    }),
  },
})
