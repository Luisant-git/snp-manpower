import { Module } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [WhatsAppModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, AuthGuard, AdminGuard],
})
export class RegistrationsModule {}
