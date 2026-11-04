import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard, getSessionUser, SessionUser } from '../common/auth.guard';
import { RegistrationsService } from './registrations.service';

type SessionRequest = Request & { session: Request['session'] & { user?: SessionUser } };

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() body: Record<string, unknown>, @Req() request: SessionRequest) {
    return this.registrationsService.create(body, getSessionUser(request));
  }

  @Get('my-submissions')
  @UseGuards(AuthGuard)
  listMySubmissions(@Req() request: SessionRequest) {
    return this.registrationsService.listMySubmissions(getSessionUser(request));
  }

  @Post('track')
  track(@Body() body: { ref: string; mobile: string }) {
    return this.registrationsService.track(body.ref, body.mobile);
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  listAll() {
    return this.registrationsService.listAll();
  }

  @Get(':ref')
  @UseGuards(AuthGuard)
  getOne(@Param('ref') ref: string, @Req() request: SessionRequest) {
    return this.registrationsService.getOne(ref, getSessionUser(request));
  }

  @Patch(':ref/review')
  @UseGuards(AuthGuard, AdminGuard)
  review(
    @Param('ref') ref: string,
    @Body() body: { status?: string; feesPaid?: number },
  ) {
    return this.registrationsService.review(ref, body);
  }

  @Delete(':ref')
  @UseGuards(AuthGuard, AdminGuard)
  remove(@Param('ref') ref: string) {
    return this.registrationsService.remove(ref);
  }
}
