import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { MailService } from './mail.service'
import { PrismaModule } from '../prisma/prima.module'

@Module({
  imports: [PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, MailService],
})
export class PaymentModule {}
