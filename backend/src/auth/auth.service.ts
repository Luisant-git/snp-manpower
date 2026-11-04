import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OtpPurpose, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SessionUser } from '../common/auth.guard';
import { OtpService } from '../whatsapp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
  ) {}

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
      const existing = await transaction.user.findUnique({ where: { mobile } });
      if (existing && !existing.isActive) {
        throw new UnauthorizedException('This account is inactive. Contact an administrator.');
      }
      const user = existing || await transaction.user.create({
        data: {
          mobile,
          name: `Applicant ${mobile}`,
          role: UserRole.APPLICANT,
          passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 12),
        },
      });
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
