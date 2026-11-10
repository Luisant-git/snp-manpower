import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeeMasterService {
  constructor(private readonly prisma: PrismaService) {}

  async getRegistrationFee(): Promise<{ id: number; name: string; amount: number; description: string | null; isActive: boolean }> {
    let fee = await this.prisma.feeMaster.findFirst({
      where: { name: 'Registration Fee' },
    });

    if (!fee) {
      fee = await this.prisma.feeMaster.create({
        data: {
          name: 'Registration Fee',
          amount: 2400,
          description: 'Driver and Candidate Registration Processing Fee',
          isActive: true,
        },
      });
    }

    return fee;
  }

  async listAll() {
    await this.getRegistrationFee(); // Ensure default exists
    return this.prisma.feeMaster.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async updateRegistrationFee(amount: number, description?: string) {
    if (typeof amount !== 'number' || isNaN(amount) || !Number.isInteger(amount) || amount < 0) {
      throw new BadRequestException('Fee amount must be a whole-rupee positive integer (e.g. 2400).');
    }

    const current = await this.getRegistrationFee();
    return this.prisma.feeMaster.update({
      where: { id: current.id },
      data: {
        amount,
        ...(description !== undefined ? { description: description.trim() } : {}),
      },
    });
  }
}

