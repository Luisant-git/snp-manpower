import { Controller, ForbiddenException, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthGuard, getSessionUser, SessionUser } from '../common/auth.guard';
import { UsersService } from './users.service';

type SessionRequest = Request & { session: Request['session'] & { user?: SessionUser } };

@Controller('employees')
@UseGuards(AuthGuard)
export class EmployeeLookupController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':mobile')
  findOne(@Param('mobile') mobile: string, @Req() request: SessionRequest) {
    const user = getSessionUser(request);
    if (user.role === UserRole.APPLICANT) {
      throw new ForbiddenException('Employee lookup is only available to staff.');
    }
    return this.usersService.findEmployee(mobile);
  }
}
