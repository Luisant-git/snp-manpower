import { Module } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { UsersController } from './users.controller';
import { EmployeeLookupController } from './employee-lookup.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController, EmployeeLookupController],
  providers: [UsersService, AuthGuard, AdminGuard],
})
export class UsersModule {}
