import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard, getSessionUser, SessionUser } from '../common/auth.guard';
import { RegistrationsService } from './registrations.service';

type SessionRequest = Request & { session: Request['session'] & { user?: SessionUser } };

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

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

  @Get('edit-requests')
  @UseGuards(AuthGuard, AdminGuard)
  listEditRequests(
    @Query('search') search?: string,
    @Query('approvedBy') approvedBy?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    if (fromDate && !isCalendarDate(fromDate)) {
      throw new BadRequestException('fromDate must use YYYY-MM-DD format.');
    }
    if (toDate && !isCalendarDate(toDate)) {
      throw new BadRequestException('toDate must use YYYY-MM-DD format.');
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('fromDate cannot be after toDate.');
    }
    return this.registrationsService.listEditRequests({ search, approvedBy, fromDate, toDate });
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
    @Body() body: { status?: string; feesPaid?: number; rejectionReason?: string },
    @Req() request: SessionRequest,
  ) {
    return this.registrationsService.review(ref, body, getSessionUser(request));
  }

  @Patch(':ref')
  @UseGuards(AuthGuard)
  update(
    @Param('ref') ref: string,
    @Body() body: Record<string, unknown>,
    @Req() request: SessionRequest,
  ) {
    return this.registrationsService.update(ref, body, getSessionUser(request));
  }

  @Post(':ref/request-edit')
  @UseGuards(AuthGuard)
  requestEdit(
    @Param('ref') ref: string,
    @Body() body: { notes: string },
    @Req() request: SessionRequest,
  ) {
    return this.registrationsService.requestEdit(ref, body?.notes, getSessionUser(request));
  }

  @Patch(':ref/review-edit-request')
  @UseGuards(AuthGuard, AdminGuard)
  reviewEditRequest(
    @Param('ref') ref: string,
    @Body() body: { action: string; reason?: string },
    @Req() request: SessionRequest,
  ) {
    return this.registrationsService.reviewEditRequest(ref, body, getSessionUser(request));
  }

  @Delete(':ref')
  @UseGuards(AuthGuard, AdminGuard)
  remove(@Param('ref') ref: string) {
    return this.registrationsService.remove(ref);
  }
}
