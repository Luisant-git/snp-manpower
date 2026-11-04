import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { OtpPurpose, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from './whatsapp.service';

const codeLifetimeMs = 5 * 60 * 1000;
const resendCooldownMs = 60 * 1000;
const maxVerificationAttempts = 5;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsApp: WhatsAppService,
  ) {}

  async request(mobileInput: unknown, purposeInput: unknown) {
    const mobile = this.normalizeMobile(mobileInput);
    const purpose = this.normalizePurpose(purposeInput);
    const since = new Date(Date.now() - resendCooldownMs);
    const recentChallenge = await this.prisma.otpChallenge.findFirst({
      where: { mobile, purpose, createdAt: { gt: since } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (recentChallenge) {
      throw new HttpException('Please wait 60 seconds before requesting another OTP.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = String(randomInt(100000, 1000000));
    const challenge = await this.prisma.otpChallenge.create({
      data: {
        mobile,
        purpose,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + codeLifetimeMs),
      },
    });

    try {
      await this.whatsApp.sendOtp(mobile, code);
    } catch (error) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw error;
    }

    return { message: 'OTP sent on WhatsApp.', expiresInSeconds: codeLifetimeMs / 1000 };
  }

  async verify(mobileInput: unknown, purposeInput: unknown, codeInput: unknown) {
    const mobile = this.normalizeMobile(mobileInput);
    const purpose = this.normalizePurpose(purposeInput);
    const code = String(codeInput || '');
    if (!/^\d{6}$/.test(code)) throw new BadRequestException('OTP must contain 6 digits.');

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { mobile, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.expiresAt <= new Date()) {
      throw new BadRequestException('OTP is invalid or expired. Request a new OTP.');
    }
    if (challenge.attempts >= maxVerificationAttempts) {
      throw new HttpException('Too many incorrect attempts. Request a new OTP.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const matches = await bcrypt.compare(code, challenge.codeHash);
    if (!matches) {
      const updated = await this.prisma.otpChallenge.updateMany({
        where: { id: challenge.id, attempts: { lt: maxVerificationAttempts } },
        data: { attempts: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw new HttpException('Too many incorrect attempts. Request a new OTP.', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw new BadRequestException('Incorrect OTP.');
    }

    if (challenge.verifiedAt) return { verified: true };
    const updated = await this.prisma.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: maxVerificationAttempts },
      },
      data: { verifiedAt: new Date() },
    });
    if (updated.count === 0) throw new BadRequestException('OTP is invalid or expired. Request a new OTP.');
    return { verified: true };
  }

  async consumeVerified(
    transaction: Prisma.TransactionClient,
    mobileInput: unknown,
    purpose: OtpPurpose,
  ) {
    const mobile = this.normalizeMobile(mobileInput);
    const challenge = await transaction.otpChallenge.findFirst({
      where: {
        mobile,
        purpose,
        consumedAt: null,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
        attempts: { lt: maxVerificationAttempts },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge) {
      throw new BadRequestException(
        `${purpose === OtpPurpose.CANDIDATE ? 'Candidate' : purpose === OtpPurpose.EMPLOYEE ? 'Employee' : 'Login'} mobile OTP must be verified before continuing.`,
      );
    }

    const consumed = await transaction.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) throw new BadRequestException('OTP has already been used. Verify the mobile again.');
  }

  private normalizeMobile(value: unknown) {
    const mobile = String(value || '').replace(/\D/g, '');
    const localMobile = mobile.startsWith('91') && mobile.length === 12 ? mobile.slice(2) : mobile;
    if (!/^\d{10}$/.test(localMobile)) throw new BadRequestException('Mobile must contain exactly 10 digits.');
    return localMobile;
  }

  private normalizePurpose(value: unknown) {
    const purpose = String(value || '').toUpperCase();
    if (![OtpPurpose.CANDIDATE, OtpPurpose.EMPLOYEE, OtpPurpose.LOGIN].includes(purpose as OtpPurpose)) {
      throw new BadRequestException('OTP purpose must be CANDIDATE, EMPLOYEE, or LOGIN.');
    }
    return purpose as OtpPurpose;
  }
}
