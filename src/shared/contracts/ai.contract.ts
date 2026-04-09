import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { withExceptionResponse } from './helpers'
import { TourListItemSchema } from '../schema/tour.schema'

const c = initContract()

export const aiContract = c.router({
  sendMessage: {
    method: 'POST',
    path: '/chat/message',
    body: z.object({
      sessionId: z.number().int().optional(),
      sessionKey: z.string().min(10).max(200).optional(),
      message: z.string().min(1).max(2000),
    }),
    responses: withExceptionResponse({
      200: z.object({
        sessionId: z.number().int(),
        sessionKey: z.string().optional(),
        reply: z.string(),
        tours: z.array(TourListItemSchema).optional(),
      }),
    }),
  },

  getFaq: {
    method: 'GET',
    path: '/faq',
    responses: withExceptionResponse({
      200: z.array(
        z.object({
          question: z.string(),
          answer: z.string(),
          keywords: z.array(z.string()),
        }),
      ),
    }),
  },
})

