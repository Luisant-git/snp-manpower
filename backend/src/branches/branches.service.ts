import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  list(includeInactive: boolean) {
    return this.prisma.branch.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async listPaginated(query: {
    search?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const pageSize = this.parsePositiveInteger(query.pageSize, 10, 'pageSize');
    if (pageSize > 100) throw new BadRequestException('pageSize cannot exceed 100.');
    const skip = (page - 1) * pageSize;
    if (!Number.isSafeInteger(skip)) throw new BadRequestException('Requested page is too large.');

    const where: Prisma.BranchWhereInput = {};
    const search = query.search?.trim();
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;

    const [items, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async create(value: string) {
    const name = this.normalizeName(value);
    try {
      return await this.prisma.branch.create({ data: { name } });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('This branch already exists.');
      throw error;
    }
  }

  async update(id: number, body: { name?: string; isActive?: boolean }) {
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      throw new BadRequestException('isActive must be a boolean.');
    }
    const data: { name?: string; isActive?: boolean } = {};
    if (body.name !== undefined) data.name = this.normalizeName(body.name);
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (!Object.keys(data).length) throw new BadRequestException('Provide a branch name or active status.');
    try {
      return await this.prisma.branch.update({ where: { id }, data });
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new BadRequestException('This branch already exists.');
      throw error;
    }
  }

  private normalizeName(value: string) {
    const name = String(value || '').trim();
    if (!name || name.length > 160) throw new BadRequestException('Branch name is required and must be at most 160 characters.');
    return name;
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private parsePositiveInteger(value: string | undefined, defaultValue: number, field: string) {
    if (value === undefined || value === '') return defaultValue;
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${field} must be a positive integer.`);
    }
    return parsed;
  }
}
