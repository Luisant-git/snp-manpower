import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';

@Module({
  controllers: [WhatsAppController],
  providers: [OtpService, WhatsAppService],
  exports: [OtpService, WhatsAppService],
})
export class WhatsAppModule {}
