import { Module } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { UploadsController } from './uploads.controller';

@Module({
  controllers: [UploadsController],
  providers: [AuthGuard],
})
export class UploadsModule {}
