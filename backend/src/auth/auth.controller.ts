import { Body, Controller, Get, Post, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { getSessionUser, SessionUser } from '../common/auth.guard';

type SessionRequest = Request & { session: Request['session'] & { user?: SessionUser } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/identify')
  identifyLogin(@Body() body: { mobile: string }) {
    return this.authService.identifyLogin(body.mobile);
  }

  @Post('login')
  async login(
    @Body() body: { mobile: string; password: string },
    @Req() request: SessionRequest,
  ) {
    const user = await this.authService.login(body.mobile, body.password);
    await this.establishSession(request, user);
    return user;
  }

  @Post('login/otp')
  async loginWithOtp(
    @Body() body: { mobile: string; code: string },
    @Req() request: SessionRequest,
  ) {
    const user = await this.authService.loginWithOtp(body.mobile, body.code);
    await this.establishSession(request, user);
    return user;
  }

  @Post('logout')
  async logout(@Req() request: SessionRequest) {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => (error ? reject(error) : resolve()));
    });
    return { message: 'Logged out.' };
  }

  @Get('me')
  async me(@Req() request: SessionRequest) {
    const sessionUser = getSessionUser(request);
    const user = await this.authService.getActiveUser(sessionUser.id);
    if (!user) {
      request.session.destroy(() => undefined);
      throw new UnauthorizedException('This account is inactive or no longer exists.');
    }
    request.session.user = user;
    return user;
  }

  private async establishSession(request: SessionRequest, user: SessionUser) {
    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((error) => (error ? reject(error) : resolve()));
    });
    request.session.user = user;
    await new Promise<void>((resolve, reject) => {
      request.session.save((error) => (error ? reject(error) : resolve()));
    });
  }
}
