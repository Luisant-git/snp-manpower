import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, EditRequestStatus, NotificationStatus, OtpPurpose, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { SessionUser } from '../common/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { FeeMasterService } from '../fee-master/fee-master.service';
import { OtpService } from '../whatsapp/otp.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { parseRegistrationDetails } from './registration-details.dto';

const defaultRegistrationFee = 2400;
const applicationStatuses = new Set<string>(Object.values(ApplicationStatus));
const adminRoles: readonly UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly whatsApp: WhatsAppService,
    private readonly feeMasterService: FeeMasterService,
  ) { }

  async create(body: Record<string, unknown>, user: SessionUser) {
    const details = parseRegistrationDetails(body.registrationData ?? body);
    const name = String(body.name ?? details.fullName ?? '').trim();
    const mobile = this.normalizeMobile(body.mobile ?? details.mobile);
    const feeConfig = await this.feeMasterService.getRegistrationFee();
    const maxRegistrationFee = feeConfig?.amount ?? defaultRegistrationFee;
    const feesPaid = this.parseFeesPaid(body.feesPaid ?? details.registrationFeePaid ?? 0);
    if (!name || name.length > 160) throw new BadRequestException('Candidate name is required.');
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

    let registration;
    try {
      registration = await this.prisma.$transaction(async (transaction) => {
        const ref = await this.generateReference(transaction);
        await this.otpService.consumeVerified(transaction, mobile, OtpPurpose.CANDIDATE);
        await this.otpService.consumeVerified(transaction, employeeMobile, OtpPurpose.EMPLOYEE);
        const created = await transaction.registration.create({
          data: {
            ref,
            name,
            mobile,
            designation: String(body.designation ?? details.designation ?? '').trim() || null,
            status: ApplicationStatus.UNDER_REVIEW,
            paymentStatus: this.paymentStatus(feesPaid, maxRegistrationFee),
            feesPaid,
            feesPending: Math.max(0, maxRegistrationFee - feesPaid),
            details: { ...details, regNo: ref } as Prisma.InputJsonValue,
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

        const candidateUser = await transaction.user.findUnique({ where: { mobile } });
        if (!candidateUser) {
          await transaction.user.create({
            data: {
              mobile,
              name,
              passwordHash: '',
              role: UserRole.APPLICANT,
              isActive: true,
              branchId: branch?.id ?? user.branchId,
            },
          });
        }

        return created;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('This registration reference already exists.');
      throw error;
    }

    return registration;
  }

  listMySubmissions(user: SessionUser) {
    if (adminRoles.includes(user.role)) return this.listAll();
    const cleanMobile = this.normalizeMobile(user.mobile);
    if (user.role === UserRole.APPLICANT) {
      return this.prisma.registration.findMany({
        where: { mobile: cleanMobile },
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true } },
          submittedBy: { select: { id: true, name: true, mobile: true } },
        },
      });
    }
    return this.prisma.registration.findMany({
      where: {
        OR: [
          { submittedByUserId: user.id },
          { submittedByMobile: cleanMobile },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, mobile: true } },
      },
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
      include: {
        branch: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, mobile: true } },
      },
    });
    if (!registration) throw new NotFoundException('Registration not found.');
    const cleanUserMobile = String(user.mobile || '').replace(/\D/g, '');
    const cleanRegMobile = String(registration.mobile || '').replace(/\D/g, '');
    const cleanSubmitterMobile = String(registration.submittedByMobile || '').replace(/\D/g, '');
    const isOwner =
      registration.submittedByUserId === user.id ||
      cleanSubmitterMobile === cleanUserMobile ||
      cleanRegMobile === cleanUserMobile;
    if (!adminRoles.includes(user.role) && !isOwner) {
      throw new ForbiddenException('You can only view your own registrations.');
    }
    return registration;
  }

  async update(ref: string, body: Record<string, unknown>, user: SessionUser) {
    const registration = await this.prisma.registration.findUnique({ where: { ref } });
    if (!registration) throw new NotFoundException('Registration not found.');

    const isAdmin = adminRoles.includes(user.role);

    if (!isAdmin) {
      const cleanUserMobile = String(user.mobile || '').replace(/\D/g, '');
      const cleanRegMobile = String(registration.mobile || '').replace(/\D/g, '');
      const cleanSubmitterMobile = String(registration.submittedByMobile || '').replace(/\D/g, '');
      const isOwner =
        registration.submittedByUserId === user.id ||
        cleanSubmitterMobile === cleanUserMobile ||
        cleanRegMobile === cleanUserMobile;

      if (!isOwner) {
        throw new ForbiddenException('You can only edit your own registrations.');
      }

      if (registration.editRequestStatus !== EditRequestStatus.APPROVED) {
        throw new ForbiddenException('You cannot edit this application until your edit request has been approved.');
      }
    }

    const details = parseRegistrationDetails(body.registrationData);
    const name = String(body.name ?? details.fullName ?? '').trim();
    const mobile = this.normalizeMobile(body.mobile ?? details.mobile);
    if (!name || name.length > 160) throw new BadRequestException('Candidate name is required.');
    if (!details.presentAddress?.trim() || !details.permanentAddress?.trim()) {
      throw new BadRequestException('Present and permanent addresses are required.');
    }
    if (!details.addressProofUrl) {
      throw new BadRequestException('An address proof document is required.');
    }

    let branchId = registration.branchId;
    const branchName = String(details.employeeBranch || '').trim();
    if (branchName) {
      const branch = await this.prisma.branch.findFirst({ where: { name: branchName, isActive: true } });
      if (!branch) throw new BadRequestException('Selected branch is not active or does not exist.');
      branchId = branch.id;
    }

    const updatePayload: Prisma.RegistrationUpdateInput = {
      name,
      mobile,
      designation: String(body.designation ?? details.designation ?? '').trim() || null,
      details: details as Prisma.InputJsonValue,
      photoUrl: this.optionalString(details.photoUrl),
      addressProofUrl: this.optionalString(details.addressProofUrl),
      addressProofName: this.optionalString(details.addressProofName),
      bankProofUrl: this.optionalString(details.bankProofUrl),
      bankProofName: this.optionalString(details.bankProofName),
      branch: branchId ? { connect: { id: branchId } } : undefined,
    };

    if (!isAdmin && registration.editRequestStatus === EditRequestStatus.APPROVED) {
      updatePayload.editRequestStatus = EditRequestStatus.COMPLETED;
    }

    try {
      return await this.prisma.registration.update({
        where: { ref },
        data: updatePayload,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('This registration reference already exists.');
      throw error;
    }
  }

  async review(
    ref: string,
    body: { status?: string; feesPaid?: number; rejectionReason?: string },
    user: SessionUser,
  ) {
    const existing = await this.prisma.registration.findUnique({ where: { ref } });
    if (!existing) throw new NotFoundException('Registration not found.');
    const data: {
      status?: ApplicationStatus;
      feesPaid?: number;
      feesPending?: number;
      paymentStatus?: PaymentStatus;
      adminApprovedById?: number | null;
      adminApprovedByName?: string | null;
      adminApprovedAt?: Date | null;
      superAdminApprovedById?: number | null;
      superAdminApprovedByName?: string | null;
      superAdminApprovedAt?: Date | null;
      rejectionReason?: string | null;
      rejectedByRole?: UserRole | null;
    } = {};

    if (body.status !== undefined) {
      const status = String(body.status).toUpperCase();
      if (!applicationStatuses.has(status)) {
        throw new BadRequestException('Status must be UNDER_REVIEW, ADMIN_APPROVED, APPROVED, or REJECTED.');
      }
      const rejectionReason = String(body.rejectionReason || '').trim();
      if (status === ApplicationStatus.REJECTED && !rejectionReason) {
        throw new BadRequestException('A rejection reason is required.');
      }

      if (user.role === UserRole.ADMIN) {
        if (status === ApplicationStatus.APPROVED) {
          throw new BadRequestException('Admin cannot give final approval. Super Admin must approve after Admin review.');
        }
        if (status === ApplicationStatus.ADMIN_APPROVED) {
          data.adminApprovedById = user.id;
          data.adminApprovedByName = user.name;
          data.adminApprovedAt = new Date();
        }
      } else if (user.role === UserRole.SUPER_ADMIN) {
        if (status === ApplicationStatus.ADMIN_APPROVED) {
          throw new BadRequestException('Admin must give the first approval.');
        }
        if (status === ApplicationStatus.APPROVED) {
          if (existing.status !== ApplicationStatus.ADMIN_APPROVED) {
            throw new BadRequestException('Admin must approve this application before Super Admin can give final approval.');
          }
          data.superAdminApprovedById = user.id;
          data.superAdminApprovedByName = user.name;
          data.superAdminApprovedAt = new Date();
        }
      } else {
        throw new ForbiddenException('You do not have permission to review applications.');
      }

      data.status = status as ApplicationStatus;
      data.rejectionReason = status === ApplicationStatus.REJECTED ? rejectionReason : null;
      data.rejectedByRole = status === ApplicationStatus.REJECTED ? user.role : null;
    }

    if (body.feesPaid !== undefined) {
      const feeConfig = await this.feeMasterService.getRegistrationFee();
      const maxRegistrationFee = feeConfig?.amount ?? defaultRegistrationFee;
      if (!Number.isInteger(body.feesPaid) || body.feesPaid < 0 || body.feesPaid > maxRegistrationFee) {
        throw new BadRequestException(`feesPaid must be a whole amount from 0 to ${maxRegistrationFee}.`);
      }
      data.feesPaid = body.feesPaid;
      data.feesPending = Math.max(0, maxRegistrationFee - body.feesPaid);
      data.paymentStatus = this.paymentStatus(body.feesPaid, maxRegistrationFee);
    }
    if (!Object.keys(data).length) throw new BadRequestException('Provide a review status or feesPaid amount.');
    const registration = await this.prisma.registration.update({ where: { ref }, data });
    const approved = registration.status === ApplicationStatus.APPROVED;
    if (!approved || registration.confirmationStatus === NotificationStatus.SENT) return registration;

    try {
      const messageId = await this.whatsApp.sendRegistrationConfirmation(
        registration.mobile,
        registration.name,
        registration.ref,
        registration.designation || 'General Staff',
      );
      return this.prisma.registration.update({
        where: { ref },
        data: { confirmationStatus: NotificationStatus.SENT, confirmationMessageId: messageId },
      });
    } catch (error) {
      this.logger.error(`Registration ${ref} was approved, but its WhatsApp confirmation could not be delivered.`);
      return this.prisma.registration.update({
        where: { ref },
        data: { confirmationStatus: NotificationStatus.FAILED },
      });
    }
  }

  async requestEdit(ref: string, notesInput: unknown, user: SessionUser) {
    const registration = await this.prisma.registration.findUnique({ where: { ref } });
    if (!registration) throw new NotFoundException('Registration not found.');

    const cleanUserMobile = String(user.mobile || '').replace(/\D/g, '');
    const cleanRegMobile = String(registration.mobile || '').replace(/\D/g, '');
    const cleanSubmitterMobile = String(registration.submittedByMobile || '').replace(/\D/g, '');
    const isOwner =
      registration.submittedByUserId === user.id ||
      cleanSubmitterMobile === cleanUserMobile ||
      cleanRegMobile === cleanUserMobile;

    if (!isOwner && !adminRoles.includes(user.role)) {
      throw new ForbiddenException('You can only request edits for your own registrations.');
    }

    const notes = String(notesInput || '').trim();
    if (!notes || notes.length < 3) {
      throw new BadRequestException('Please provide a reason / notes for the edit request (at least 3 characters).');
    }

    if (registration.editRequestStatus === EditRequestStatus.PENDING) {
      throw new BadRequestException('An edit request is already submitted and pending review.');
    }
    if (registration.editRequestStatus === EditRequestStatus.APPROVED) {
      throw new BadRequestException('Edit permission is already approved. You can edit the application now.');
    }

    return this.prisma.registration.update({
      where: { ref },
      data: {
        editRequestStatus: EditRequestStatus.PENDING,
        editRequestNotes: notes,
        editRequestedAt: new Date(),
        editRequestedByUserId: user.id,
        editRequestedByName: user.name,
        editApprovedById: null,
        editApprovedByName: null,
        editApprovedAt: null,
        editRejectedById: null,
        editRejectedByName: null,
        editRejectedAt: null,
        editRequestRejectionReason: null,
      },
    });
  }

  async reviewEditRequest(
    ref: string,
    body: { action: string; reason?: string },
    user: SessionUser,
  ) {
    const registration = await this.prisma.registration.findUnique({ where: { ref } });
    if (!registration) throw new NotFoundException('Registration not found.');

    if (registration.editRequestStatus !== EditRequestStatus.PENDING) {
      throw new BadRequestException('No pending edit request found for this application.');
    }

    const action = String(body.action || '').toUpperCase();
    if (action !== 'APPROVE' && action !== 'REJECT') {
      throw new BadRequestException('Action must be APPROVE or REJECT.');
    }

    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to review edit requests.');
    }

    const rejectionReason = String(body.reason || '').trim();
    if (action === 'REJECT' && !rejectionReason) {
      throw new BadRequestException('A rejection reason is required.');
    }

    const reviewedAt = new Date();
    if (action === 'APPROVE') {
      return this.prisma.registration.update({
        where: { ref },
        data: {
          editRequestStatus: EditRequestStatus.APPROVED,
          editApprovedById: user.id,
          editApprovedByName: user.name,
          editApprovedAt: reviewedAt,
          editRejectedById: null,
          editRejectedByName: null,
          editRejectedAt: null,
          editRequestRejectionReason: null,
        },
      });
    }

    return this.prisma.registration.update({
      where: { ref },
      data: {
        editRequestStatus: EditRequestStatus.REJECTED,
        editApprovedById: null,
        editApprovedByName: null,
        editApprovedAt: null,
        editRejectedById: user.id,
        editRejectedByName: user.name,
        editRejectedAt: reviewedAt,
        editRequestRejectionReason: rejectionReason,
      },
    });
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

  private paymentStatus(paid: number, maxFee = defaultRegistrationFee) {
    if (paid === 0) return PaymentStatus.PENDING;
    return paid >= maxFee ? PaymentStatus.PAID : PaymentStatus.PARTIAL;
  }

  private async generateReference(transaction: Prisma.TransactionClient) {
    const now = new Date();
    const dateKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
    const prefix = `SNP-${dateKey}-`;
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${dateKey}))`;
    const existing = await transaction.registration.findMany({
      where: { ref: { startsWith: prefix } },
      select: { ref: true },
    });
    const lastSequence = existing.reduce((highest, registration) => {
      const match = registration.ref.match(/^SNP-\d{8}-(\d+)$/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `${prefix}${String(lastSequence + 1).padStart(4, '0')}`;
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
