import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AdminGuard } from '../common/admin.guard';
import { AuthGuard, getSessionUser, SessionUser } from '../common/auth.guard';
import { HiringJobsService } from './hiring-jobs.service';

type SessionRequest = Request & { session: Request['session'] & { user?: SessionUser } };

@Controller('hiring-jobs')
export class HiringJobsController {
  constructor(private readonly hiringJobsService: HiringJobsService) {}

  @Get('approvals')
  @UseGuards(AuthGuard, AdminGuard)
  listApprovals() {
    return this.hiringJobsService.listApprovals();
  }

  @Get('available')
  @UseGuards(AuthGuard)
  listAvailable() {
    return this.hiringJobsService.listAvailable();
  }

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  listJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hiringJobsService.listJobs(page, limit);
  }

  @Post(':jobId/approve')
  @UseGuards(AuthGuard, AdminGuard)
  approve(
    @Param('jobId') jobId: string,
    @Body() body: { job?: Record<string, unknown> },
    @Req() request: SessionRequest,
  ) {
    if (!body?.job) throw new BadRequestException('Job details are required.');
    return this.hiringJobsService.approve(jobId, body.job, getSessionUser(request));
  }
}
