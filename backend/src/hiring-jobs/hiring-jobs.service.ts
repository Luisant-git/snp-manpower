import { BadGatewayException, BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { JobApprovalStatus, Prisma, UserRole } from '@prisma/client';
import axios from 'axios';
import { SessionUser } from '../common/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

const JOB_REQUIREMENTS_URL =
  process.env.JOB_REQUIREMENTS_API_URL || 'https://api.makecallsnp.com/api/job-requirements';
const JOB_REQUIREMENTS_TOKEN = process.env.JOB_REQUIREMENTS_API_TOKEN || '';

type JobPayload = Record<string, unknown>;

function cleanText(value: unknown, fallback = '') {
  if (typeof value === 'string') return value.trim();
  if (value == null) return fallback;
  return String(value).trim();
}

function cleanOptionalText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => cleanText(entry)).filter(Boolean);
}

function dateFilterValue(value: string | undefined, label: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${label} must be a valid date.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`${label} must be a valid date.`);
  }
  return value;
}

function postedDate(job: JobPayload) {
  return cleanText(job.createdAt || job.postedAt || job.posted_at);
}

function toRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function buildJobSnapshot(jobId: string, job: JobPayload) {
  return {
    id: jobId,
    title: cleanText(job.title, 'Untitled job'),
    company: cleanText(job.company),
    city: cleanText(job.city),
    localities: cleanStringArray(job.localities),
    description: cleanText(job.description),
    jobType: cleanText(job.jobType),
    category: cleanText(job.category),
    role: cleanText(job.role),
    contactName: cleanText(job.contactName),
    contactPhone: cleanText(job.contactPhone),
    whatsappNumber: cleanText(job.whatsappNumber),
    contactEmail: cleanText(job.contactEmail),
    showContact: Boolean(job.showContact),
    salaryMin: cleanNumber(job.salaryMin),
    salaryMax: cleanNumber(job.salaryMax),
    experienceMin: cleanNumber(job.experienceMin),
    experienceMax: cleanNumber(job.experienceMax),
    remoteWork: cleanText(job.remoteWork),
    status: cleanText(job.status, 'ACTIVE').toUpperCase(),
    createdAt: cleanOptionalText(postedDate(job)),
  };
}

@Injectable()
export class HiringJobsService {
  constructor(private readonly prisma: PrismaService) {}

  private async fetchJobPage(pageNumber: number, limitNumber: number) {
    const url = new URL(JOB_REQUIREMENTS_URL);
    url.searchParams.set('page', String(pageNumber));
    url.searchParams.set('limit', String(limitNumber));

    try {
      const response = await axios.get(url.toString(), {
        headers: {
          Accept: 'application/json',
          ...(JOB_REQUIREMENTS_TOKEN
            ? { Authorization: `Bearer ${JOB_REQUIREMENTS_TOKEN}` }
            : {}),
        },
        timeout: 15000,
      });
      if (response.data?.success === false) {
        throw new BadGatewayException(
          response.data?.message || response.data?.error || 'Hiring jobs service could not load jobs.',
        );
      }

      const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
      const total = Number(response.data?.total);
      return {
        jobs,
        total: Number.isFinite(total) && total >= 0
          ? Math.max(total, jobs.length)
          : jobs.length,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          (error.response?.status
            ? `Hiring jobs service returned ${error.response.status}.`
            : 'Unable to connect to the hiring jobs service.');
        throw new BadGatewayException(message);
      }
      throw new BadGatewayException('Unable to load hiring jobs.');
    }
  }

  private async fetchAllLiveJobs(pageSize: number) {
    const firstPage = await this.fetchJobPage(1, pageSize);
    const jobs = [...firstPage.jobs];
    const pageCount = Math.ceil(firstPage.total / pageSize);

    for (let page = 2; page <= pageCount; page += 1) {
      const result = await this.fetchJobPage(page, pageSize);
      if (result.jobs.length === 0) break;
      jobs.push(...result.jobs);
    }

    return jobs;
  }

  private async applyClosedOverrides(jobs: JobPayload[]) {
    const jobIds = jobs.map((job) => cleanText(job.id)).filter(Boolean);
    if (jobIds.length === 0) return jobs;
    const approvals = await this.prisma.jobApproval.findMany({
      where: { externalJobId: { in: jobIds } },
      select: { externalJobId: true, jobSnapshot: true },
    });
    const closedIds = new Set(
      approvals
        .filter((approval) => cleanText(toRecord(approval.jobSnapshot).status).toUpperCase() === 'CLOSED')
        .map((approval) => approval.externalJobId),
    );
    return jobs.map((job) => (
      closedIds.has(cleanText(job.id)) ? { ...job, status: 'CLOSED' } : job
    ));
  }

  async listJobs(page = '1', limit = '50', fromDate?: string, toDate?: string) {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 50));
    const from = dateFilterValue(fromDate, 'From date');
    const to = dateFilterValue(toDate, 'To date');
    if (from && to && from > to) {
      throw new BadRequestException('From date must be on or before To date.');
    }

    if (from || to) {
      const allJobs = await this.fetchAllLiveJobs(100);
      const uniqueJobs = new Map<string, JobPayload>();
      allJobs.forEach((job) => {
        const jobId = cleanText(job.id);
        if (jobId && !uniqueJobs.has(jobId)) uniqueJobs.set(jobId, job);
      });
      const filteredJobs = [...uniqueJobs.values()].filter((job) => {
        const date = postedDate(job);
        const day = date.slice(0, 10);
        const parsedDay = /^\d{4}-\d{2}-\d{2}$/.test(day)
          ? new Date(`${day}T00:00:00.000Z`)
          : null;
        const validDay = parsedDay && !Number.isNaN(parsedDay.getTime()) &&
          parsedDay.toISOString().slice(0, 10) === day;
        return Boolean(validDay) && (!from || day >= from) && (!to || day <= to);
      });
      const start = (pageNumber - 1) * limitNumber;
      return {
        success: true,
        jobs: await this.applyClosedOverrides(filteredJobs.slice(start, start + limitNumber)),
        total: filteredJobs.length,
      };
    }

    const result = await this.fetchJobPage(pageNumber, limitNumber);
    return {
      success: true,
      ...result,
      jobs: await this.applyClosedOverrides(result.jobs),
    };
  }

  async listApprovals() {
    const approvals = await this.prisma.jobApproval.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return { approvals };
  }

  async getApplicantAccess(user: SessionUser) {
    if (user.role !== UserRole.APPLICANT) {
      return { canViewAvailableJobs: true, applicationStatus: null };
    }

    const mobile = cleanText(user.mobile).replace(/\D/g, '');
    const localMobile = mobile.startsWith('91') && mobile.length === 12
      ? mobile.slice(2)
      : mobile;
    if (!/^\d{10}$/.test(localMobile)) {
      throw new ForbiddenException('Unable to verify your application status.');
    }

    const latestApplication = await this.prisma.registration.findFirst({
      where: { mobile: localMobile },
      orderBy: [{ createdAt: 'desc' }, { ref: 'desc' }],
      select: { status: true },
    });
    const applicationStatus = latestApplication?.status ?? null;
    return {
      canViewAvailableJobs: applicationStatus !== 'REJECTED',
      applicationStatus,
    };
  }

  async listAvailable(user: SessionUser) {
    const access = await this.getApplicantAccess(user);
    if (!access.canViewAvailableJobs) {
      throw new ForbiddenException('Your latest application was rejected. Available jobs are not accessible.');
    }

    const approvals = await this.prisma.jobApproval.findMany({
      where: { status: JobApprovalStatus.APPROVED },
      orderBy: { superAdminApprovedAt: 'desc' },
    });

    if (approvals.length === 0) return { jobs: [], total: 0 };

    const approvedByJobId = new Map(
      approvals.map((approval) => [approval.externalJobId, approval]),
    );
    const sourceJobs = await this.fetchAllLiveJobs(100);
    const seenJobIds = new Set<string>();
    const jobs = sourceJobs
      .map((job): Record<string, unknown> | null => {
        const jobId = cleanText(job.id);
        const approval = approvedByJobId.get(jobId);
        if (
          !jobId ||
          !approval ||
          seenJobIds.has(jobId) ||
          cleanText(toRecord(approval.jobSnapshot).status).toUpperCase() === 'CLOSED' ||
          cleanText(job.status, 'ACTIVE').toUpperCase() === 'CLOSED'
        ) {
          return null;
        }

        seenJobIds.add(jobId);
        return {
          ...job,
          approval: {
            status: approval.status,
            adminApprovedByName: approval.adminApprovedByName,
            adminApprovedAt: approval.adminApprovedAt,
            superAdminApprovedByName: approval.superAdminApprovedByName,
            superAdminApprovedAt: approval.superAdminApprovedAt,
          },
        };
      })
      .filter((job): job is Record<string, unknown> => job !== null);

    return { jobs, total: jobs.length };
  }

  async approve(jobId: string, job: JobPayload, user: SessionUser) {
    const normalizedJobId = cleanText(jobId);
    if (!normalizedJobId) throw new BadRequestException('Job id is required.');
    if (!job || typeof job !== 'object' || Array.isArray(job)) {
      throw new BadRequestException('Job details are required.');
    }

    const liveJobs = await this.fetchAllLiveJobs(100);
    const liveJob = liveJobs.find((entry) => cleanText(entry.id) === normalizedJobId);
    if (!liveJob) {
      throw new BadRequestException('This job is no longer available in the hiring jobs feed.');
    }

    const existing = await this.prisma.jobApproval.findUnique({
      where: { externalJobId: normalizedJobId },
    });
    const snapshot = buildJobSnapshot(normalizedJobId, liveJob);
    if (snapshot.status === 'CLOSED') {
      throw new BadRequestException('Closed jobs cannot be approved.');
    }

    if (user.role === UserRole.ADMIN) {
      if (existing?.status === JobApprovalStatus.APPROVED) return existing;
      if (existing?.status === JobApprovalStatus.ADMIN_APPROVED) {
        return this.prisma.jobApproval.update({
          where: { externalJobId: normalizedJobId },
          data: { jobSnapshot: snapshot as Prisma.InputJsonValue },
        });
      }

      const now = new Date();
      const data = {
        jobSnapshot: snapshot as Prisma.InputJsonValue,
        status: JobApprovalStatus.ADMIN_APPROVED,
        adminApprovedById: user.id,
        adminApprovedByName: user.name,
        adminApprovedAt: now,
        superAdminApprovedById: null,
        superAdminApprovedByName: null,
        superAdminApprovedAt: null,
        rejectedById: null,
        rejectedByName: null,
        rejectedAt: null,
        rejectionReason: null,
      };

      return this.prisma.jobApproval.upsert({
        where: { externalJobId: normalizedJobId },
        create: { externalJobId: normalizedJobId, ...data },
        update: data,
      });
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      if (!existing || existing.status !== JobApprovalStatus.ADMIN_APPROVED) {
        throw new BadRequestException(
          'Admin must approve this job before Super Admin can give final approval.',
        );
      }

      return this.prisma.jobApproval.update({
        where: { externalJobId: normalizedJobId },
        data: {
          jobSnapshot: snapshot as Prisma.InputJsonValue,
          status: JobApprovalStatus.APPROVED,
          superAdminApprovedById: user.id,
          superAdminApprovedByName: user.name,
          superAdminApprovedAt: new Date(),
        },
      });
    }

    throw new ForbiddenException('You do not have permission to approve jobs.');
  }

  async reject(jobId: string, job: JobPayload, user: SessionUser) {
    const normalizedJobId = cleanText(jobId);
    if (!normalizedJobId) throw new BadRequestException('Job id is required.');
    if (!job || typeof job !== 'object' || Array.isArray(job)) {
      throw new BadRequestException('Job details are required.');
    }

    const liveJobs = await this.fetchAllLiveJobs(100);
    const liveJob = liveJobs.find((entry) => cleanText(entry.id) === normalizedJobId);
    if (!liveJob) {
      throw new BadRequestException('This job is no longer available in the hiring jobs feed.');
    }

    const existing = await this.prisma.jobApproval.findUnique({
      where: { externalJobId: normalizedJobId },
    });
    const snapshot = buildJobSnapshot(normalizedJobId, liveJob);
    if (snapshot.status === 'CLOSED') {
      throw new BadRequestException('Closed jobs cannot be rejected.');
    }

    if (user.role === UserRole.ADMIN) {
      if (
        existing &&
        existing.status !== JobApprovalStatus.PENDING &&
        existing.status !== JobApprovalStatus.REJECTED
      ) {
        throw new BadRequestException('Admin can only review jobs awaiting Admin approval.');
      }
    } else if (
      user.role === UserRole.SUPER_ADMIN &&
      existing?.status !== JobApprovalStatus.ADMIN_APPROVED
    ) {
      throw new BadRequestException(
        'Admin must approve this job before Super Admin can review it.',
      );
    } else if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to reject jobs.');
    }

    const now = new Date();
    const commonData = {
      jobSnapshot: snapshot as Prisma.InputJsonValue,
      status: JobApprovalStatus.REJECTED,
      rejectedById: user.id,
      rejectedByName: user.name,
      rejectedAt: now,
      rejectionReason: null,
      superAdminApprovedById: null,
      superAdminApprovedByName: null,
      superAdminApprovedAt: null,
    };
    const data = user.role === UserRole.ADMIN
      ? {
          ...commonData,
          adminApprovedById: null,
          adminApprovedByName: null,
          adminApprovedAt: null,
        }
      : commonData;

    return this.prisma.jobApproval.upsert({
      where: { externalJobId: normalizedJobId },
      create: { externalJobId: normalizedJobId, ...data },
      update: data,
    });
  }

  async close(jobId: string, user: SessionUser) {
    const normalizedJobId = cleanText(jobId);
    if (!normalizedJobId) throw new BadRequestException('Job id is required.');
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to close jobs.');
    }

    const existing = await this.prisma.jobApproval.findUnique({
      where: { externalJobId: normalizedJobId },
    });
    if (
      !existing ||
      existing.status !== JobApprovalStatus.APPROVED
    ) {
      throw new BadRequestException('Only fully approved jobs can be closed.');
    }

    const liveJobs = await this.fetchAllLiveJobs(100);
    const liveJob = liveJobs.find((entry) => cleanText(entry.id) === normalizedJobId);
    if (!liveJob) {
      throw new BadRequestException('This job is no longer available in the hiring jobs feed.');
    }

    const snapshot = buildJobSnapshot(normalizedJobId, liveJob);
    return this.prisma.jobApproval.update({
      where: { externalJobId: normalizedJobId },
      data: {
        jobSnapshot: { ...snapshot, status: 'CLOSED' } as Prisma.InputJsonValue,
      },
    });
  }

  async reopen(jobId: string, user: SessionUser) {
    const normalizedJobId = cleanText(jobId);
    if (!normalizedJobId) throw new BadRequestException('Job id is required.');
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to reopen jobs.');
    }

    const existing = await this.prisma.jobApproval.findUnique({
      where: { externalJobId: normalizedJobId },
    });
    if (
      !existing ||
      existing.status !== JobApprovalStatus.APPROVED ||
      cleanText(toRecord(existing.jobSnapshot).status).toUpperCase() !== 'CLOSED'
    ) {
      throw new BadRequestException('Only fully approved, closed jobs can be reopened.');
    }

    const liveJobs = await this.fetchAllLiveJobs(100);
    const liveJob = liveJobs.find((entry) => cleanText(entry.id) === normalizedJobId);
    if (!liveJob) {
      throw new BadRequestException('This job is no longer available in the hiring jobs feed.');
    }

    const snapshot = buildJobSnapshot(normalizedJobId, liveJob);
    if (snapshot.status === 'CLOSED') {
      throw new BadRequestException('This job is closed in the hiring jobs feed and cannot be reopened.');
    }

    return this.prisma.jobApproval.update({
      where: { externalJobId: normalizedJobId },
      data: { jobSnapshot: snapshot as Prisma.InputJsonValue },
    });
  }
}
