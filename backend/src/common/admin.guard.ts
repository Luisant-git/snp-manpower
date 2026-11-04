import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { getSessionUser } from './auth.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (getSessionUser(request).role !== UserRole.ADMIN) {
      throw new ForbiddenException('Administrator access is required.');
    }
    return true;
  }
}
