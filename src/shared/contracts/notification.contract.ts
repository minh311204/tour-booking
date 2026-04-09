import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { withExceptionResponse } from './helpers'
import {
  NotificationSchema,
  UnreadCountSchema,
} from '../schema/notification.schema'

const c = initContract()
const idParams = z.object({ id: z.coerce.number().int() })

export const notificationContract = c.router({
  getNotifications: {
    method: 'GET',
    path: '',
    query: z.object({
      unreadOnly: z.enum(['true', 'false']).optional(),
      limit: z.coerce.number().int().min(1).max(50).optional(),
    }),
    responses: withExceptionResponse({
      200: z.array(NotificationSchema),
    }),
  },

  getUnreadCount: {
    method: 'GET',
    path: '/unread-count',
    responses: withExceptionResponse({
      200: UnreadCountSchema,
    }),
  },

  markAsRead: {
    method: 'PATCH',
    path: '/:id/read',
    pathParams: idParams,
    body: z.object({}),
    responses: withExceptionResponse({
      200: NotificationSchema,
    }),
  },

  markAllAsRead: {
    method: 'PATCH',
    path: '/read-all',
    body: z.object({}),
    responses: withExceptionResponse({
      200: z.object({ count: z.number() }),
    }),
  },

  deleteNotification: {
    method: 'DELETE',
    path: '/:id',
    pathParams: idParams,
    responses: withExceptionResponse({
      200: z.object({ message: z.string() }),
    }),
  },
})
