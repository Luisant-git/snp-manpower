import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { PrismaModule } from './prisma/prisma.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { UsersModule } from './users/users.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, BranchesModule, RegistrationsModule, WhatsAppModule],
})
export class AppModule {}
