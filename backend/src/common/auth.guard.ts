import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@prisma/client';

export type SessionUser = {
  id: number;
  name: string;
  mobile: string;
  role: UserRole;
  branchId: number | null;
};

type SessionRequest = Request & { session: Request['session'] & { user?: SessionUser } };

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    if (!request.session.user) throw new UnauthorizedException('Please log in.');
    return true;
  }
}

export function getSessionUser(request: Request & { session: Request['session'] & { user?: SessionUser } }) {
  if (!request.session.user) throw new UnauthorizedException('Please log in.');
  return request.session.user;
}
