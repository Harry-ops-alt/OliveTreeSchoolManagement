import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, active?: boolean) {
    const where: Prisma.DiscountWhereInput = {
      organizationId,
      ...(active !== undefined ? { active } : {}),
    };

    return this.prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async create(dto: CreateDiscountDto) {
    if (!dto.percentage && !dto.fixedAmount) {
      throw new BadRequestException('Either percentage or fixedAmount must be provided');
    }

    if (dto.code) {
      const existing = await this.prisma.discount.findUnique({ where: { code: dto.code } });
      if (existing) throw new BadRequestException('Discount code already exists');
    }

    return this.prisma.discount.create({
      data: {
        organizationId: dto.organizationId,
        code: dto.code ?? null,
        name: dto.name,
        type: dto.type,
        percentage: dto.percentage ?? null,
        fixedAmount: dto.fixedAmount ?? null,
        criteria: (dto.criteria as Prisma.InputJsonValue) ?? undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
  }

  async validate(code: string, studentId: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { code },
    });

    if (!discount) throw new NotFoundException('Discount code not found');
    if (!discount.active) throw new BadRequestException('Discount is not active');

    const now = new Date();
    if (discount.validFrom && now < discount.validFrom) {
      throw new BadRequestException('Discount is not yet valid');
    }
    if (discount.validTo && now > discount.validTo) {
      throw new BadRequestException('Discount has expired');
    }

    return discount;
  }
}
