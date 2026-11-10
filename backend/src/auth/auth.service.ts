import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { OtpPurpose, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SessionUser } from '../common/auth.guard';
import { OtpService } from '../whatsapp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
  ) {}

  async identifyLogin(mobileInput: string): Promise<{ method: 'password' | 'otp' }> {
    const raw = String(mobileInput || '').replace(/\D/g, '');
    const mobile = raw.startsWith('91') && raw.length === 12 ? raw.slice(2) : raw;
    if (!/^\d{10}$/.test(mobile)) {
      throw new BadRequestException('Enter a valid 10-digit mobile number.');
    }

    const user = await this.prisma.user.findUnique({
      where: { mobile },
      select: { role: true, isActive: true },
    });
    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('This account is inactive. Contact an administrator.');
      }
      return { method: user.role === UserRole.ADMIN ? 'password' : 'otp' };
    }

    const registration = await this.prisma.registration.findFirst({
      where: { mobile },
      select: { id: true, name: true },
    });
    if (registration) {
      return { method: 'otp' };
    }

    throw new UnauthorizedException(
      'This mobile number is not registered. Please register first or contact an administrator.',
    );
  }

  async login(mobile: string, password: string): Promise<SessionUser> {
    const normalizedMobile = String(mobile || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(normalizedMobile) || typeof password !== 'string' || !password) {
      throw new UnauthorizedException('Invalid mobile number or password.');
    }

    const user = await this.prisma.user.findUnique({ where: { mobile: normalizedMobile } });
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid mobile number or password.');
    }
    return this.toSessionUser(user);
  }

  async getActiveUser(id: number): Promise<SessionUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user?.isActive ? this.toSessionUser(user) : null;
  }

  async loginWithOtp(mobileInput: string, code: string): Promise<SessionUser> {
    const mobile = String(mobileInput || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(mobile)) throw new UnauthorizedException('Invalid mobile or OTP.');
    try {
      await this.otpService.verify(mobile, OtpPurpose.LOGIN, code);
    } catch {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    return this.prisma.$transaction(async (transaction) => {
      await this.otpService.consumeVerified(transaction, mobile, OtpPurpose.LOGIN);
      let user = await transaction.user.findUnique({ where: { mobile } });
      if (!user) {
        const registration = await transaction.registration.findFirst({
          where: { mobile },
          orderBy: { createdAt: 'desc' },
        });
        if (!registration) {
          throw new UnauthorizedException(
            'This mobile number is not registered. Please register first or contact an administrator.',
          );
        }
        user = await transaction.user.create({
          data: {
            mobile,
            name: registration.name || 'Job Seeker',
            passwordHash: '',
            role: UserRole.APPLICANT,
            isActive: true,
            branchId: registration.branchId,
          },
        });
      }
      if (!user.isActive) {
        throw new UnauthorizedException('This account is inactive. Contact an administrator.');
      }
      if (user.role === UserRole.ADMIN) {
        throw new UnauthorizedException('Administrators must sign in with their password.');
      }
      return this.toSessionUser(user);
    });
  }

  private toSessionUser(user: {
    id: number;
    name: string;
    mobile: string;
    role: UserRole;
    branchId: number | null;
  }): SessionUser {
    return {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      branchId: user.branchId,
    };
  }
}
