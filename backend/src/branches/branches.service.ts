import { BadRequestException, Injectable } from '@nestjs/common';
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
}
