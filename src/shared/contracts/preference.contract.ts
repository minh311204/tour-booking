import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { withExceptionResponse } from './helpers'
import {
  UserPreferenceSchema,
  UpsertUserPreferenceSchema,
  TrackBehaviorSchema,
  UserBehaviorSchema,
} from '../schema/preference.schema'
import { TourListItemSchema } from '../schema/tour.schema'

const c = initContract()

export const preferenceContract = c.router({
  getMyPreference: {
    method: 'GET',
    path: '/me',
    responses: withExceptionResponse({
      200: UserPreferenceSchema.nullable(),
    }),
  },

  upsertMyPreference: {
    method: 'PUT',
    path: '/me',
    body: UpsertUserPreferenceSchema,
    responses: withExceptionResponse({
      200: UserPreferenceSchema,
    }),
  },

  trackBehavior: {
    method: 'POST',
    path: '/behaviors',
    body: TrackBehaviorSchema,
    responses: withExceptionResponse({
      201: UserBehaviorSchema,
    }),
  },

  getMyBehaviors: {
    method: 'GET',
    path: '/behaviors',
    query: z.object({
      action: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
    responses: withExceptionResponse({
      200: z.array(UserBehaviorSchema),
    }),
  },

  getRecommendations: {
    method: 'GET',
    path: '/recommendations',
    query: z.object({
      limit: z.coerce.number().int().min(1).max(20).optional(),
    }),
    responses: withExceptionResponse({
      200: z.array(TourListItemSchema),
    }),
  },
})
