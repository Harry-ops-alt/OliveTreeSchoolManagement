import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { ListFeeStructuresDto } from './dto/list-fee-structures.dto';

@Injectable()
export class FeeStructuresService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListFeeStructuresDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.FeeStructureWhereInput = {
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.billingCycle ? { billingCycle: query.billingCycle } : {}),
      ...(query.yearGroup ? { yearGroup: query.yearGroup } : {}),
      ...(typeof query.active === 'string' ? { active: query.active === 'true' } : {}),
    };

    const orderBy = this.parseOrder(query.order);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.feeStructure.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.feeStructure.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const feeStructure = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            studentId: true,
            status: true,
          },
        },
      },
    });

    if (!feeStructure) throw new NotFoundException('Fee structure not found');
    return feeStructure;
  }

  async create(dto: CreateFeeStructureDto) {
    // Validate organization exists
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org) throw new BadRequestException('Organization does not exist');

    // Validate branch if provided
    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, organizationId: dto.organizationId },
      });
      if (!branch) throw new BadRequestException('Branch does not exist or does not belong to organization');
    }

    // Validate class if provided
    if (dto.classId) {
      const classItem = await this.prisma.class.findFirst({
        where: { id: dto.classId, isDeleted: false },
      });
      if (!classItem) throw new BadRequestException('Class does not exist');
      
      if (dto.branchId && classItem.branchId !== dto.branchId) {
        throw new BadRequestException('Class does not belong to the specified branch');
      }
    }

    // Check for duplicate name in same organization
    const existing = await this.prisma.feeStructure.findFirst({
      where: {
        organizationId: dto.organizationId,
        name: dto.name,
        active: true,
      },
    });
    if (existing) {
      throw new BadRequestException('A fee structure with this name already exists');
    }

    const created = await this.prisma.feeStructure.create({
      data: {
        organizationId: dto.organizationId,
        branchId: dto.branchId ?? null,
        classId: dto.classId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        amount: dto.amount,
        currency: dto.currency ?? 'GBP',
        billingCycle: dto.billingCycle,
        yearGroup: dto.yearGroup ?? null,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return created;
  }

  async update(id: string, dto: UpdateFeeStructureDto) {
    const existing = await this.prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fee structure not found');

    // Validate branch if changing
    if (dto.branchId !== undefined && dto.branchId !== existing.branchId) {
      if (dto.branchId) {
        const branch = await this.prisma.branch.findFirst({
          where: { id: dto.branchId, organizationId: existing.organizationId },
        });
        if (!branch) throw new BadRequestException('Branch does not exist or does not belong to organization');
      }
    }

    // Validate class if changing
    if (dto.classId !== undefined && dto.classId !== existing.classId) {
      if (dto.classId) {
        const classItem = await this.prisma.class.findFirst({
          where: { id: dto.classId, isDeleted: false },
        });
        if (!classItem) throw new BadRequestException('Class does not exist');
        
        const targetBranchId = dto.branchId !== undefined ? dto.branchId : existing.branchId;
        if (targetBranchId && classItem.branchId !== targetBranchId) {
          throw new BadRequestException('Class does not belong to the specified branch');
        }
      }
    }

    const updated = await this.prisma.feeStructure.update({
      where: { id },
      data: {
        ...(dto.branchId !== undefined ? { branchId: dto.branchId } : {}),
        ...(dto.classId !== undefined ? { classId: dto.classId } : {}),
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.billingCycle ? { billingCycle: dto.billingCycle } : {}),
        ...(dto.yearGroup !== undefined ? { yearGroup: dto.yearGroup } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata as Prisma.InputJsonValue } : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return updated;
  }

  async archive(id: string) {
    const existing = await this.prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fee structure not found');

    // Check for active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        feeStructureId: id,
        status: 'ACTIVE',
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot archive fee structure with ${activeSubscriptions} active subscription(s)`,
      );
    }

    return this.prisma.feeStructure.update({
      where: { id },
      data: { active: false },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  private parseOrder(
    order?: string,
  ): Prisma.FeeStructureOrderByWithRelationInput | Prisma.FeeStructureOrderByWithRelationInput[] | undefined {
    if (!order) return { name: 'asc' };

    const parts = order.split(',').map((s) => s.trim()).filter(Boolean);
    const parsed = parts
      .map((p) => {
        const [field, dir] = p.split(':');
        const direction = dir?.toLowerCase() === 'asc' ? 'asc' : 'desc';

        if (field === 'name' || field === 'amount' || field === 'billingCycle' || field === 'createdAt') {
          return { [field]: direction } as Prisma.FeeStructureOrderByWithRelationInput;
        }

        return undefined;
      })
      .filter(Boolean) as Prisma.FeeStructureOrderByWithRelationInput[];

    return parsed.length > 0 ? parsed : { name: 'asc' };
  }
}
