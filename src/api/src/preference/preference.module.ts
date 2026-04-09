import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prima.module'
import { PreferenceController } from './preference.controller'
import { PreferenceService } from './preference.service'

@Module({
  imports: [PrismaModule],
  controllers: [PreferenceController],
  providers: [PreferenceService],
})
export class PreferenceModule {}
