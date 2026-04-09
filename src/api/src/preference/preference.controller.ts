import { Controller, UseGuards } from '@nestjs/common'
import { TsRestHandler } from '@ts-rest/nest'
import { preferenceContract } from '../../../shared/contracts/preference.contract'
import { PreferenceService } from './preference.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferenceController {
  constructor(private readonly preferenceService: PreferenceService) {}

  @TsRestHandler(preferenceContract.getMyPreference)
  getMyPreference(@CurrentUser() user: { id: number }) {
    return async () => {
      const body = await this.preferenceService.getMyPreference(user.id)
      return { status: 200 as const, body }
    }
  }

  @TsRestHandler(preferenceContract.upsertMyPreference)
  upsertMyPreference(@CurrentUser() user: { id: number }) {
    return async ({ body }: { body: any }) => {
      const result = await this.preferenceService.upsertMyPreference(user.id, body)
      return { status: 200 as const, body: result }
    }
  }

  @TsRestHandler(preferenceContract.trackBehavior)
  trackBehavior(@CurrentUser() user: { id: number }) {
    return async ({
      body,
    }: {
      body: { tourId: number; action: string }
    }) => {
      const result = await this.preferenceService.trackBehavior(
        user.id,
        body.tourId,
        body.action,
      )
      return { status: 201 as const, body: result }
    }
  }

  @TsRestHandler(preferenceContract.getMyBehaviors)
  getMyBehaviors(@CurrentUser() user: { id: number }) {
    return async ({ query }: { query: Record<string, unknown> }) => {
      const body = await this.preferenceService.getMyBehaviors(user.id, {
        action: query['action'] as string | undefined,
        limit: query['limit'] ? Number(query['limit']) : undefined,
      })
      return { status: 200 as const, body }
    }
  }

  @TsRestHandler(preferenceContract.getRecommendations)
  getRecommendations(@CurrentUser() user: { id: number }) {
    return async ({ query }: { query: Record<string, unknown> }) => {
      const limit = query['limit'] ? Number(query['limit']) : 10
      const body = await this.preferenceService.getRecommendations(user.id, limit)
      return { status: 200 as const, body }
    }
  }
}
