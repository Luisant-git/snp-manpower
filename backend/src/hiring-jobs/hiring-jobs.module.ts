import { Module } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { HiringJobsController } from './hiring-jobs.controller';
import { HiringJobsService } from './hiring-jobs.service';

@Module({
  controllers: [HiringJobsController],
  providers: [HiringJobsService, AuthGuard, AdminGuard],
})
export class HiringJobsModule {}
