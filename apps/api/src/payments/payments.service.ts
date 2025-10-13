import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPaymentsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.PaymentWhereInput = {
      ...(query.invoiceId ? { invoiceId: query.invoiceId } : {}),
      ...(query.studentId ? { invoice: { studentId: query.studentId } } : {}),
      ...(query.paymentMethod ? { paymentMethod: query.paymentMethod } : {}),
      ...(query.fromDate ? { paymentDate: { gte: new Date(query.fromDate) } } : {}),
      ...(query.toDate ? { paymentDate: { lte: new Date(query.toDate) } } : {}),
    };

    const orderBy = this.parseOrder(query.order);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          invoice: {
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
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
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
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
        },
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async recordPayment(dto: RecordPaymentDto, recordedById: string) {
    // Validate invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });
    if (!invoice) throw new BadRequestException('Invoice does not exist');

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payment for cancelled invoice');
    }

    // Calculate remaining amount
    const remainingAmount = Number(invoice.amount) - Number(invoice.paidAmount);
    if (dto.amount > remainingAmount) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds remaining balance (${remainingAmount})`,
      );
    }

    // Record payment and update invoice in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: dto.invoiceId,
          amount: dto.amount,
          paymentDate: new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod,
          reference: dto.reference ?? null,
          notes: dto.notes ?? null,
          recordedById,
          metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
        },
        include: {
          invoice: true,
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update invoice paid amount and status
      const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
      const newStatus =
        newPaidAmount >= Number(invoice.amount)
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIALLY_PAID;

      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      return payment;
    });

    return result;
  }

  async refund(id: string, amount: number, reason: string, recordedById: string) {
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: true },
    });

    if (!existingPayment) throw new NotFoundException('Payment not found');

    if (amount > Number(existingPayment.amount)) {
      throw new BadRequestException('Refund amount cannot exceed original payment amount');
    }

    // Create negative payment (refund) and update invoice
    const result = await this.prisma.$transaction(async (tx) => {
      const refundPayment = await tx.payment.create({
        data: {
          invoiceId: existingPayment.invoiceId,
          amount: -amount,
          paymentDate: new Date(),
          paymentMethod: existingPayment.paymentMethod,
          reference: `REFUND-${existingPayment.reference ?? existingPayment.id}`,
          notes: reason,
          recordedById,
          metadata: {
            refundOf: id,
            reason,
          } as Prisma.InputJsonValue,
        },
      });

      // Update invoice paid amount and status
      const newPaidAmount = Number(existingPayment.invoice.paidAmount) - amount;
      const newStatus =
        newPaidAmount <= 0
          ? InvoiceStatus.ISSUED
          : newPaidAmount >= Number(existingPayment.invoice.amount)
            ? InvoiceStatus.PAID
            : InvoiceStatus.PARTIALLY_PAID;

      await tx.invoice.update({
        where: { id: existingPayment.invoiceId },
        data: {
          paidAmount: Math.max(0, newPaidAmount),
          status: newStatus,
        },
      });

      return refundPayment;
    });

    return result;
  }

  private parseOrder(
    order?: string,
  ): Prisma.PaymentOrderByWithRelationInput | Prisma.PaymentOrderByWithRelationInput[] | undefined {
    if (!order) return { paymentDate: 'desc' };

    const parts = order.split(',').map((s) => s.trim()).filter(Boolean);
    const parsed = parts
      .map((p) => {
        const [field, dir] = p.split(':');
        const direction = dir?.toLowerCase() === 'asc' ? 'asc' : 'desc';

        if (field === 'paymentDate' || field === 'amount') {
          return { [field]: direction } as Prisma.PaymentOrderByWithRelationInput;
        }

        return undefined;
      })
      .filter(Boolean) as Prisma.PaymentOrderByWithRelationInput[];

    return parsed.length > 0 ? parsed : { paymentDate: 'desc' };
  }
}
