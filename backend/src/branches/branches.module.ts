import { Module } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService, AuthGuard, AdminGuard],
})
export class BranchesModule {}
