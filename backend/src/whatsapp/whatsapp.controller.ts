import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly otpService: OtpService) {}

  @Post('otp/request')
  requestOtp(@Body() body: { mobile: string; purpose: string }) {
    return this.otpService.request(body.mobile, body.purpose);
  }

  @Post('otp/verify')
  verifyOtp(@Body() body: { mobile: string; purpose: string; code: string }) {
    return this.otpService.verify(body.mobile, body.purpose, body.code);
  }
}
