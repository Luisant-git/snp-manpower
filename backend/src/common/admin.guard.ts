import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { getSessionUser } from './auth.guard';

export const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.ADMIN_1, UserRole.ADMIN_2];

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!adminRoles.includes(getSessionUser(request).role)) {
      throw new ForbiddenException('Administrator access is required.');
    }
    return true;
  }
}
