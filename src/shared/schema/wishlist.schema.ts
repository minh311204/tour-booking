import { z } from 'zod'
import { TourListItemSchema } from './tour.schema'

export const WishlistItemSchema = z.object({
  id: z.number(),
  userId: z.number(),
  tourId: z.number(),
  createdAtUtc: z.string().nullable().optional(),
  tour: TourListItemSchema,
})

export const AddToWishlistSchema = z.object({
  tourId: z.number().int().positive(),
})

export const WishlistCheckSchema = z.object({
  inWishlist: z.boolean(),
})
