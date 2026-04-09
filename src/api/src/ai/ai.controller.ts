import { Controller, UseGuards } from '@nestjs/common'
import { TsRestHandler } from '@ts-rest/nest'
import { aiContract } from '../../../shared/contracts/ai.contract'
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard'
import { AiService } from './ai.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @TsRestHandler(aiContract.sendMessage)
  @UseGuards(OptionalJwtAuthGuard)
  sendMessage(@CurrentUser() user?: { id: number } | null) {
    return async ({
      body,
    }: {
      body: { sessionId?: number; sessionKey?: string; message: string }
    }) => {
      const userId = user?.id != null ? Number(user.id) : null
      const result = await this.aiService.sendMessage({
        userId,
        sessionId: body.sessionId,
        sessionKey: body.sessionKey,
        message: body.message,
      })
      return { status: 200, body: result }
    }
  }

  @TsRestHandler(aiContract.getFaq)
  getFaq() {
    return async () => {
      return { status: 200, body: this.aiService.getFaq() }
    }
  }
}

