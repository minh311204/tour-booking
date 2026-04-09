import { z } from 'zod'

export const NotificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  isRead: z.boolean(),
  createdAtUtc: z.string().nullable().optional(),
})

export const MarkReadSchema = z.object({
  isRead: z.boolean(),
})

export const UnreadCountSchema = z.object({
  count: z.number(),
})
