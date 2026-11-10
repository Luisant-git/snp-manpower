import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard } from '../common/auth.guard';
import { FeeMasterService } from './fee-master.service';

@Controller('fee-master')
export class FeeMasterController {
  constructor(private readonly feeMasterService: FeeMasterService) {}

  @Get('registration-fee')
  getRegistrationFee() {
    return this.feeMasterService.getRegistrationFee();
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  listAll() {
    return this.feeMasterService.listAll();
  }

  @Put('registration-fee')
  @UseGuards(AuthGuard, AdminGuard)
  updateRegistrationFee(@Body() body: { amount: number; description?: string }) {
    return this.feeMasterService.updateRegistrationFee(Number(body.amount), body.description);
  }
}

