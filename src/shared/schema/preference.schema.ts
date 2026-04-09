import { z } from 'zod'

export const UserPreferenceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  preferredLocations: z.string().nullable().optional(),
  budgetRange: z.string().nullable().optional(),
  travelStyle: z.string().nullable().optional(),
})

export const UpsertUserPreferenceSchema = z.object({
  preferredLocations: z.string().max(500).nullable().optional(),
  budgetRange: z.enum(['under_5m', '5_10m', '10_20m', 'over_20m']).nullable().optional(),
  travelStyle: z.enum(['adventure', 'cultural', 'relaxation', 'family', 'luxury', 'budget']).nullable().optional(),
})

export const TrackBehaviorSchema = z.object({
  tourId: z.number().int().positive(),
  action: z.enum(['view', 'wishlist', 'book', 'review', 'search']),
})

export const UserBehaviorSchema = z.object({
  id: z.number(),
  userId: z.number(),
  tourId: z.number(),
  action: z.string(),
  createdAtUtc: z.string().nullable().optional(),
})

export const TourEmbeddingUpsertSchema = z.object({
  embedding: z.string(),
  contentChunk: z.string().optional(),
})

export const RecommendedTourSchema = z.object({
  tourId: z.number(),
  score: z.number(),
})
