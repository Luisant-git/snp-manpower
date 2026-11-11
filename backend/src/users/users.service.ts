import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const roles = new Set<string>(Object.values(UserRole));
const adminRoles: readonly UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
        isActive: true,
        branchId: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findEmployee(mobileInput: string) {
    const mobile = this.normalizeMobile(mobileInput);
    const user = await this.prisma.user.findFirst({
      where: { mobile, role: UserRole.EMPLOYEE, isActive: true },
      select: {
        id: true,
        name: true,
        mobile: true,
        branch: { select: { name: true, isActive: true } },
      },
    });
    if (!user) throw new NotFoundException('No active employee is registered with this mobile number.');
    if (!user.branch?.isActive) throw new NotFoundException('This employee has no active branch assigned.');
    return {
      id: user.id,
      name: user.name,
      mobile: user.mobile,
      branch: user.branch.name,
    };
  }

  async create(body: {
    name: string;
    mobile: string;
    password?: string;
    role?: string;
    branchId?: number;
  }) {
    const name = this.requiredName(body.name);
    const mobile = this.normalizeMobile(body.mobile);
    const role = this.parseRole(body.role || UserRole.EMPLOYEE);
    if (adminRoles.includes(role) && !body.password) {
      throw new BadRequestException('An administrator password is required.');
    }
    const passwordHash = body.password
      ? await this.hashPassword(body.password)
      : await this.hashPassword(randomBytes(32).toString('hex'));
    await this.assertBranch(body.branchId);
    try {
      return await this.prisma.user.create({
        data: { name, mobile, passwordHash, role, branchId: body.branchId || null },
        select: { id: true, name: true, mobile: true, role: true, isActive: true, branchId: true, createdAt: true },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('This mobile number is already registered.');
      throw error;
    }
  }

  async update(
    id: number,
    body: { name?: string; mobile?: string; password?: string; role?: string; branchId?: number | null },
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!existing) throw new NotFoundException('User not found.');
    const nextRole = body.role === undefined ? existing.role : this.parseRole(body.role);
    if (adminRoles.includes(nextRole) && !adminRoles.includes(existing.role) && !body.password) {
      throw new BadRequestException('Set an administrator password when changing a user to administrator.');
    }
    const data: {
      name?: string;
      mobile?: string;
      passwordHash?: string;
      role?: UserRole;
      branchId?: number | null;
    } = {};
    if (body.name !== undefined) data.name = this.requiredName(body.name);
    if (body.mobile !== undefined) data.mobile = this.normalizeMobile(body.mobile);
    if (body.password !== undefined) data.passwordHash = await this.hashPassword(body.password);
    if (body.role !== undefined) data.role = nextRole;
    if (body.branchId !== undefined) {
      await this.assertBranch(body.branchId || undefined);
      data.branchId = body.branchId || null;
    }
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, mobile: true, role: true, isActive: true, branchId: true, updatedAt: true },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('This mobile number is already registered.');
      throw error;
    }
  }

  async setActive(id: number, isActive: boolean) {
    if (typeof isActive !== 'boolean') throw new BadRequestException('isActive must be a boolean.');
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, mobile: true, role: true, isActive: true },
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    if (adminRoles.includes(user.role)) {
      const activeAdmins = await this.prisma.user.count({
        where: { role: { in: [...adminRoles] }, isActive: true },
      });
      if (user.isActive && activeAdmins <= 1) {
        throw new BadRequestException('The last active administrator cannot be deleted.');
      }
    }
    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  private requiredName(value: string) {
    const name = String(value || '').trim();
    if (!name || name.length > 120) throw new BadRequestException('Name is required and must be at most 120 characters.');
    return name;
  }

  private normalizeMobile(value: string) {
    const mobile = String(value || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(mobile)) throw new BadRequestException('Mobile must contain exactly 10 digits.');
    return mobile;
  }

  private async hashPassword(value: string) {
    if (typeof value !== 'string' || value.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }
    return bcrypt.hash(value, 12);
  }

  private parseRole(value: string) {
    const role = String(value).toUpperCase();
    if (!roles.has(role)) throw new BadRequestException('Role must be SUPER_ADMIN, ADMIN, EMPLOYEE, or APPLICANT.');
    return role as UserRole;
  }

  private async assertBranch(branchId?: number) {
    if (branchId === undefined) return;
    if (!Number.isInteger(branchId) || !(await this.prisma.branch.findUnique({ where: { id: branchId } }))) {
      throw new BadRequestException('Selected branch does not exist.');
    }
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
