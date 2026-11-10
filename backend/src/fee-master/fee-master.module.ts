import { Module } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { FeeMasterController } from './fee-master.controller';
import { FeeMasterService } from './fee-master.service';

@Module({
  controllers: [FeeMasterController],
  providers: [FeeMasterService, AuthGuard, AdminGuard],
  exports: [FeeMasterService],
})
export class FeeMasterModule {}

