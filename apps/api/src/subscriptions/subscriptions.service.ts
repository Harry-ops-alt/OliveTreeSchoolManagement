import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { BillingCycle, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListSubscriptionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.SubscriptionWhereInput = {
      ...(query.q
        ? {
            OR: [
              { student: { user: { firstName: { contains: query.q, mode: 'insensitive' } } } },
              { student: { user: { lastName: { contains: query.q, mode: 'insensitive' } } } },
              { student: { studentNumber: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.branchId ? { student: { branchId: query.branchId } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const orderBy = this.parseOrder(query.order);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          feeStructure: {
            select: {
              id: true,
              name: true,
              amount: true,
              currency: true,
              billingCycle: true,
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
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
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        feeStructure: {
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
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            dueDate: true,
            amount: true,
            paidAmount: true,
            status: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
        },
      },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  async create(dto: CreateSubscriptionDto) {
    // Validate student exists
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: dto.studentId },
      include: {
        user: true,
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });
    if (!student) throw new BadRequestException('Student does not exist');

    // Validate fee structure exists and is active
    const feeStructure = await this.prisma.feeStructure.findUnique({
      where: { id: dto.feeStructureId },
    });
    if (!feeStructure) throw new BadRequestException('Fee structure does not exist');
    if (!feeStructure.active) throw new BadRequestException('Fee structure is not active');

    // Check for existing active subscription with same fee structure
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        studentId: dto.studentId,
        feeStructureId: dto.feeStructureId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    if (existingSubscription) {
      throw new BadRequestException('Student already has an active subscription for this fee structure');
    }

    // Calculate amount with discounts
    let finalAmount = Number(feeStructure.amount);
    let discountAmount = dto.discountAmount ?? 0;
    let discountReason = dto.discountReason ?? null;

    // Auto-apply sibling discount if applicable
    if (!dto.discountAmount) {
      const siblingDiscount = await this.calculateSiblingDiscount(student);
      if (siblingDiscount.amount > 0) {
        discountAmount = siblingDiscount.amount;
        discountReason = siblingDiscount.reason;
        finalAmount = finalAmount - discountAmount;
      }
    } else {
      finalAmount = finalAmount - discountAmount;
    }

    // Calculate next billing date
    const startDate = new Date(dto.startDate);
    const nextBillingDate = this.calculateNextBillingDate(startDate, feeStructure.billingCycle);

    const created = await this.prisma.subscription.create({
      data: {
        studentId: dto.studentId,
        feeStructureId: dto.feeStructureId,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        amount: finalAmount,
        discountAmount,
        discountReason,
        billingCycle: feeStructure.billingCycle,
        nextBillingDate,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            billingCycle: true,
          },
        },
      },
    });

    return created;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const existing = await this.prisma.subscription.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Subscription not found');

    const data: Prisma.SubscriptionUpdateInput = {
      ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.discountAmount !== undefined ? { discountAmount: dto.discountAmount } : {}),
      ...(dto.discountReason !== undefined ? { discountReason: dto.discountReason } : {}),
      ...(dto.nextBillingDate !== undefined
        ? { nextBillingDate: dto.nextBillingDate ? new Date(dto.nextBillingDate) : null }
        : {}),
      ...(dto.metadata !== undefined ? { metadata: dto.metadata as Prisma.InputJsonValue } : {}),
    };

    const updated = await this.prisma.subscription.update({
      where: { id },
      data,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            billingCycle: true,
          },
        },
      },
    });

    return updated;
  }

  async cancel(id: string, reason?: string) {
    const existing = await this.prisma.subscription.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Subscription not found');

    if (existing.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        endDate: new Date(),
        metadata: {
          ...(typeof existing.metadata === 'object' && existing.metadata !== null
            ? existing.metadata
            : {}),
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        feeStructure: {
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            billingCycle: true,
          },
        },
      },
    });
  }

  private async calculateSiblingDiscount(student: any): Promise<{ amount: number; reason: string }> {
    // Find siblings (students with same guardian)
    const guardianIds = student.guardians.map((sg: any) => sg.guardianId);
    if (guardianIds.length === 0) {
      return { amount: 0, reason: '' };
    }

    const siblings = await this.prisma.studentProfile.findMany({
      where: {
        id: { not: student.id },
        guardians: {
          some: {
            guardianId: { in: guardianIds },
          },
        },
        subscriptions: {
          some: {
            status: SubscriptionStatus.ACTIVE,
          },
        },
      },
    });

    if (siblings.length === 0) {
      return { amount: 0, reason: '' };
    }

    // Apply tiered sibling discount
    // 1 sibling: 10%, 2+ siblings: 15%
    const discountPercentage = siblings.length === 1 ? 10 : 15;
    const discountAmount = 0; // Will be calculated based on fee structure amount in create method

    return {
      amount: discountPercentage,
      reason: `${discountPercentage}% sibling discount (${siblings.length} sibling${siblings.length > 1 ? 's' : ''})`,
    };
  }

  private calculateNextBillingDate(startDate: Date, billingCycle: BillingCycle): Date {
    const nextDate = new Date(startDate);

    switch (billingCycle) {
      case BillingCycle.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case BillingCycle.TERMLY:
        nextDate.setMonth(nextDate.getMonth() + 4); // Assuming 4 months per term
        break;
      case BillingCycle.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case BillingCycle.ONE_TIME:
        return null as any; // One-time payments don't have next billing date
    }

    return nextDate;
  }

  private parseOrder(
    order?: string,
  ): Prisma.SubscriptionOrderByWithRelationInput | Prisma.SubscriptionOrderByWithRelationInput[] | undefined {
    if (!order) return { createdAt: 'desc' };

    const parts = order.split(',').map((s) => s.trim()).filter(Boolean);
    const parsed = parts
      .map((p) => {
        const [field, dir] = p.split(':');
        const direction = dir?.toLowerCase() === 'asc' ? 'asc' : 'desc';

        if (field === 'startDate' || field === 'nextBillingDate' || field === 'createdAt') {
          return { [field]: direction } as Prisma.SubscriptionOrderByWithRelationInput;
        }

        return undefined;
      })
      .filter(Boolean) as Prisma.SubscriptionOrderByWithRelationInput[];

    return parsed.length > 0 ? parsed : { createdAt: 'desc' };
  }
}
