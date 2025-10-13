import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListInvoicesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.InvoiceWhereInput = {
      ...(query.q
        ? {
            OR: [
              { invoiceNumber: { contains: query.q, mode: 'insensitive' } },
              { student: { user: { firstName: { contains: query.q, mode: 'insensitive' } } } },
              { student: { user: { lastName: { contains: query.q, mode: 'insensitive' } } } },
              { student: { studentNumber: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.branchId ? { student: { branchId: query.branchId } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.fromDate ? { issueDate: { gte: new Date(query.fromDate) } } : {}),
      ...(query.toDate ? { issueDate: { lte: new Date(query.toDate) } } : {}),
      ...(query.overdue === 'true'
        ? { dueDate: { lt: new Date() }, status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] } }
        : {}),
    };

    const orderBy = this.parseOrder(query.order);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
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
            },
          },
          subscription: {
            select: {
              id: true,
              feeStructure: {
                select: {
                  name: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              paymentMethod: true,
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
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
    const invoice = await this.prisma.invoice.findUnique({
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
        subscription: {
          include: {
            feeStructure: {
              select: {
                id: true,
                name: true,
                billingCycle: true,
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payments: {
          include: {
            recordedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            paymentDate: 'desc',
          },
        },
        paymentPlan: true,
      },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(dto: CreateInvoiceDto) {
    // Validate student exists
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new BadRequestException('Student does not exist');

    // Validate subscription if provided
    if (dto.subscriptionId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: dto.subscriptionId },
      });
      if (!subscription) throw new BadRequestException('Subscription does not exist');
      if (subscription.studentId !== dto.studentId) {
        throw new BadRequestException('Subscription does not belong to this student');
      }
    }

    // Calculate total amount from line items
    const totalAmount = dto.lineItems.reduce((sum, item) => {
      const quantity = item.quantity ?? 1;
      return sum + item.amount * quantity;
    }, 0);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    const created = await this.prisma.invoice.create({
      data: {
        subscriptionId: dto.subscriptionId ?? null,
        studentId: dto.studentId,
        parentId: dto.parentId ?? null,
        invoiceNumber,
        dueDate: new Date(dto.dueDate),
        amount: totalAmount,
        status: InvoiceStatus.ISSUED,
        lineItems: dto.lineItems as unknown as Prisma.InputJsonValue,
        notes: dto.notes ?? null,
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
      },
    });

    return created;
  }

  async generateFromSubscription(subscriptionId: string, periodStart: Date, periodEnd: Date) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        feeStructure: true,
        student: true,
      },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');

    const invoiceNumber = await this.generateInvoiceNumber();
    const dueDate = new Date(periodEnd);
    dueDate.setDate(dueDate.getDate() + 7); // Due 7 days after period end

    const lineItems = [
      {
        description: `${subscription.feeStructure.name} (${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()})`,
        amount: Number(subscription.amount),
        quantity: 1,
      },
    ];

    const created = await this.prisma.invoice.create({
      data: {
        subscriptionId,
        studentId: subscription.studentId,
        invoiceNumber,
        dueDate,
        amount: subscription.amount,
        status: InvoiceStatus.ISSUED,
        lineItems: lineItems as unknown as Prisma.InputJsonValue,
        metadata: {
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          generatedFromSubscription: true,
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
      },
    });

    return created;
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice not found');

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.metadata !== undefined ? { metadata: dto.metadata as Prisma.InputJsonValue } : {}),
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
      },
    });

    return updated;
  }

  async cancel(id: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Invoice not found');

    if (existing.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
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
      },
    });
  }

  async markOverdue() {
    const now = new Date();
    const result = await this.prisma.invoice.updateMany({
      where: {
        dueDate: { lt: now },
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    });

    return { count: result.count };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
    });

    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${nextNumber}`;
  }

  private parseOrder(
    order?: string,
  ): Prisma.InvoiceOrderByWithRelationInput | Prisma.InvoiceOrderByWithRelationInput[] | undefined {
    if (!order) return { issueDate: 'desc' };

    const parts = order.split(',').map((s) => s.trim()).filter(Boolean);
    const parsed = parts
      .map((p) => {
        const [field, dir] = p.split(':');
        const direction = dir?.toLowerCase() === 'asc' ? 'asc' : 'desc';

        if (field === 'issueDate' || field === 'dueDate' || field === 'amount' || field === 'status') {
          return { [field]: direction } as Prisma.InvoiceOrderByWithRelationInput;
        }

        return undefined;
      })
      .filter(Boolean) as Prisma.InvoiceOrderByWithRelationInput[];

    return parsed.length > 0 ? parsed : { issueDate: 'desc' };
  }
}
