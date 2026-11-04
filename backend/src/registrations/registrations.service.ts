import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, NotificationStatus, OtpPurpose, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { SessionUser } from '../common/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../whatsapp/otp.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { parseRegistrationDetails } from './registration-details.dto';

const maxRegistrationFee = 2400;
const applicationStatuses = new Set<string>(Object.values(ApplicationStatus));

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly whatsApp: WhatsAppService,
  ) {}

  async create(body: Record<string, unknown>, user: SessionUser) {
    const details = parseRegistrationDetails(body.registrationData ?? body);
    const name = String(body.name ?? details.fullName ?? '').trim();
    const mobile = this.normalizeMobile(body.mobile ?? details.mobile);
    const ref = String(body.ref || this.generateReference()).trim();
    const feesPaid = this.parseFeesPaid(body.feesPaid ?? details.registrationFeePaid ?? 0);
    if (!name || name.length > 160) throw new BadRequestException('Candidate name is required.');
    if (!/^[A-Za-z0-9-]{4,40}$/.test(ref)) throw new BadRequestException('Registration reference is invalid.');
    if (!Number.isInteger(feesPaid) || feesPaid < 0 || feesPaid > maxRegistrationFee) {
      throw new BadRequestException(`feesPaid must be a whole amount from 0 to ${maxRegistrationFee}.`);
    }
    if (!details.presentAddress?.trim() || !details.permanentAddress?.trim()) {
      throw new BadRequestException('Present and permanent addresses are required.');
    }
    if (!details.addressProofUrl) {
      throw new BadRequestException('An address proof document is required.');
    }
    const employeeMobile = this.normalizeMobile(details.employeeMobile);
    if (!details.employeeName?.trim()) throw new BadRequestException('Employee name is required.');

    const branchName = String(details.employeeBranch || '').trim();
    const employee = await this.prisma.user.findFirst({
      where: { mobile: employeeMobile, role: UserRole.EMPLOYEE, isActive: true },
      include: { branch: true },
    });
    if (!employee) throw new BadRequestException('Selected mobile number is not an active employee account.');
    if (!employee.branch?.isActive || employee.branch.name !== branchName) {
      throw new BadRequestException('Selected branch must match the employee account branch.');
    }
    const branch = branchName
      ? await this.prisma.branch.findFirst({ where: { name: branchName, isActive: true } })
      : null;
    if (branchName && !branch) throw new BadRequestException('Selected branch is not active or does not exist.');

    const data = details as Prisma.InputJsonValue;
    let registration;
    try {
      registration = await this.prisma.$transaction(async (transaction) => {
        await this.otpService.consumeVerified(transaction, mobile, OtpPurpose.CANDIDATE);
        await this.otpService.consumeVerified(transaction, employeeMobile, OtpPurpose.EMPLOYEE);
        return transaction.registration.create({
          data: {
            ref,
            name,
            mobile,
            designation: String(body.designation ?? details.designation ?? '').trim() || null,
            status: ApplicationStatus.UNDER_REVIEW,
            paymentStatus: this.paymentStatus(feesPaid),
            feesPaid,
            feesPending: maxRegistrationFee - feesPaid,
            details: data,
            photoUrl: this.optionalString(body.photoUrl ?? details.photoUrl),
            addressProofUrl: this.optionalString(body.addressProofUrl ?? details.addressProofUrl),
            addressProofName: this.optionalString(body.addressProofName ?? details.addressProofName),
            bankProofUrl: this.optionalString(body.bankProofUrl ?? details.bankProofUrl),
            bankProofName: this.optionalString(body.bankProofName ?? details.bankProofName),
            candidateOtpVerified: true,
            employeeOtpVerified: true,
            submittedByUserId: user.id,
            submittedByName: user.name,
            submittedByMobile: user.mobile,
            branchId: branch?.id ?? user.branchId,
          },
        });
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('This registration reference already exists.');
      throw error;
    }

    try {
      const messageId = await this.whatsApp.sendRegistrationConfirmation(
        mobile,
        name,
        registration.ref,
        registration.designation || 'General Staff',
      );
      return await this.prisma.registration.update({
        where: { id: registration.id },
        data: { confirmationStatus: NotificationStatus.SENT, confirmationMessageId: messageId },
      });
    } catch (error) {
      this.logger.error(
        `Registration ${registration.ref} was saved, but its WhatsApp confirmation could not be delivered.`,
      );
      return this.prisma.registration.update({
        where: { id: registration.id },
        data: { confirmationStatus: NotificationStatus.FAILED },
      });
    }
  }

  listMySubmissions(user: SessionUser) {
    if (user.role === UserRole.ADMIN) return this.listAll();
    return this.prisma.registration.findMany({
      where: { submittedByUserId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { branch: { select: { id: true, name: true } } },
    });
  }

  listAll() {
    return this.prisma.registration.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, mobile: true } },
      },
    });
  }

  async track(ref: string, mobileInput: string) {
    const mobile = this.normalizeMobile(mobileInput);
    const registration = await this.prisma.registration.findFirst({
      where: { ref, mobile },
      select: { ref: true, status: true, paymentStatus: true, createdAt: true },
    });
    if (!registration) throw new NotFoundException('No application was found for this reference number.');
    return registration;
  }

  async getOne(ref: string, user: SessionUser) {
    const registration = await this.prisma.registration.findUnique({
      where: { ref },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!registration) throw new NotFoundException('Registration not found.');
    if (user.role !== UserRole.ADMIN && registration.submittedByUserId !== user.id) {
      throw new ForbiddenException('You can only view your own registrations.');
    }
    return registration;
  }

  async review(ref: string, body: { status?: string; feesPaid?: number }) {
    const data: { status?: ApplicationStatus; feesPaid?: number; feesPending?: number; paymentStatus?: PaymentStatus } = {};
    if (body.status !== undefined) {
      const status = String(body.status).toUpperCase();
      if (!applicationStatuses.has(status)) {
        throw new BadRequestException('Status must be UNDER_REVIEW, APPROVED, or REJECTED.');
      }
      data.status = status as ApplicationStatus;
    }
    if (body.feesPaid !== undefined) {
      if (!Number.isInteger(body.feesPaid) || body.feesPaid < 0 || body.feesPaid > maxRegistrationFee) {
        throw new BadRequestException(`feesPaid must be a whole amount from 0 to ${maxRegistrationFee}.`);
      }
      data.feesPaid = body.feesPaid;
      data.feesPending = maxRegistrationFee - body.feesPaid;
      data.paymentStatus = this.paymentStatus(body.feesPaid);
    }
    if (!Object.keys(data).length) throw new BadRequestException('Provide a review status or feesPaid amount.');
    return this.prisma.registration.update({ where: { ref }, data });
  }

  async remove(ref: string) {
    await this.prisma.registration.delete({ where: { ref } });
    return { deleted: true };
  }

  private normalizeMobile(value: unknown) {
    const mobile = String(value || '').replace(/\D/g, '');
    const localMobile = mobile.startsWith('91') && mobile.length === 12 ? mobile.slice(2) : mobile;
    if (!/^\d{10}$/.test(localMobile)) throw new BadRequestException('Mobile must contain exactly 10 digits.');
    return localMobile;
  }

  private parseFeesPaid(value: unknown) {
    const raw = String(value).trim().replace(/[₹,\s]/g, '');
    if (!/^\d+$/.test(raw)) throw new BadRequestException('feesPaid must be a whole-rupee amount.');
    return Number(raw);
  }

  private optionalString(value: unknown) {
    if (typeof value !== 'string' || !value.trim()) return null;
    return value.trim();
  }

  private paymentStatus(paid: number) {
    if (paid === 0) return PaymentStatus.PENDING;
    return paid >= maxRegistrationFee ? PaymentStatus.PAID : PaymentStatus.PARTIAL;
  }

  private generateReference() {
    return `SNP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
