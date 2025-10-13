import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';

interface Installment {
  dueDate: string;
  amount: number;
  status: 'PENDING' | 'PAID';
}

@Injectable()
export class PaymentPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async getByInvoice(invoiceId: string) {
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { invoiceId },
      include: {
        invoice: true,
      },
    });

    if (!plan) throw new NotFoundException('Payment plan not found');
    return plan;
  }

  async create(dto: CreatePaymentPlanDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) throw new BadRequestException('Invoice does not exist');
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot create payment plan for paid invoice');
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot create payment plan for cancelled invoice');
    }

    const existing = await this.prisma.paymentPlan.findUnique({
      where: { invoiceId: dto.invoiceId },
    });
    if (existing) {
      throw new BadRequestException('Payment plan already exists for this invoice');
    }

    const remainingAmount = Number(invoice.amount) - Number(invoice.paidAmount);
    const installmentAmount = remainingAmount / dto.installmentCount;

    const installments: Installment[] = [];
    const startDate = new Date(dto.startDate);

    for (let i = 0; i < dto.installmentCount; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      installments.push({
        dueDate: dueDate.toISOString(),
        amount: Math.round(installmentAmount * 100) / 100,
        status: 'PENDING',
      });
    }

    const created = await this.prisma.paymentPlan.create({
      data: {
        invoiceId: dto.invoiceId,
        totalAmount: remainingAmount,
        installments: installments as unknown as Prisma.InputJsonValue,
      },
      include: {
        invoice: true,
      },
    });

    return created;
  }

  async markInstallmentPaid(planId: string, installmentIndex: number) {
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) throw new NotFoundException('Payment plan not found');

    const installments = plan.installments as unknown as Installment[];
    if (installmentIndex < 0 || installmentIndex >= installments.length) {
      throw new BadRequestException('Invalid installment index');
    }

    installments[installmentIndex].status = 'PAID';

    return this.prisma.paymentPlan.update({
      where: { id: planId },
      data: {
        installments: installments as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
