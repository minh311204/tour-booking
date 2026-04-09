import { Controller, UseGuards } from '@nestjs/common'
import { TsRestHandler } from '@ts-rest/nest'
import { notificationContract } from '../../../shared/contracts/notification.contract'
import { NotificationService } from './notification.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @TsRestHandler(notificationContract.getNotifications)
  getNotifications(@CurrentUser() user: { id: number }) {
    return async ({ query }: { query: Record<string, unknown> }) => {
      const unreadOnly = query['unreadOnly'] === 'true'
      const limit = query['limit'] ? Number(query['limit']) : undefined
      const body = await this.notificationService.getNotifications(user.id, {
        unreadOnly,
        limit,
      })
      return { status: 200 as const, body }
    }
  }

  @TsRestHandler(notificationContract.getUnreadCount)
  getUnreadCount(@CurrentUser() user: { id: number }) {
    return async () => {
      const body = await this.notificationService.getUnreadCount(user.id)
      return { status: 200 as const, body }
    }
  }

  @TsRestHandler(notificationContract.markAsRead)
  markAsRead(@CurrentUser() user: { id: number }) {
    return async ({ params }: { params: { id: string } }) => {
      const body = await this.notificationService.markAsRead(
        user.id,
        Number(params.id),
      )
      return { status: 200 as const, body }
    }
  }

  @TsRestHandler(notificationContract.markAllAsRead)
  markAllAsRead(@CurrentUser() user: { id: number }) {
    return async () => {
      const body = await this.notificationService.markAllAsRead(user.id)
      return { status: 200 as const, body }
    }
  }

  @TsRestHandler(notificationContract.deleteNotification)
  deleteNotification(@CurrentUser() user: { id: number }) {
    return async ({ params }: { params: { id: string } }) => {
      const body = await this.notificationService.deleteNotification(
        user.id,
        Number(params.id),
      )
      return { status: 200 as const, body }
    }
  }
}
