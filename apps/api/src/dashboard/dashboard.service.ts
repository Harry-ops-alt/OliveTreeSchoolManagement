import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SessionUserData } from '../users/users.service';
import {
  AdmissionStatus,
  FinanceTransactionType,
  Prisma,
} from '@prisma/client';

interface DashboardSummary {
  students: number;
  teachers: number;
  admissionsPending: number;
  finance: Record<FinanceTransactionType, string>;
}

interface DashboardAdmissionItem {
  id: string;
  studentName: string;
  status: AdmissionStatus;
  branchName: string;
  appliedAt: Date;
}

interface DashboardFinanceItem {
  id: string;
  type: FinanceTransactionType;
  amount: string;
  occurredAt: Date;
  branchName: string;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: SessionUserData): Promise<DashboardSummary> {
    const branchFilter = this.branchFilter(user);
    const organizationFilter = this.organizationFilter(user);

    const [students, teachers, admissions, financeGroups] = await Promise.all([
      this.prisma.studentProfile.count({ where: branchFilter ?? organizationFilter }),
      this.prisma.teacherProfile.count({ where: branchFilter ?? organizationFilter }),
      this.prisma.admission.count({
        where: {
          status: AdmissionStatus.PENDING,
          ...(branchFilter ?? organizationFilter),
        },
      }),
      this.prisma.financeTransaction.groupBy({
        by: ['type'],
        _sum: { amount: true },
        where: branchFilter ?? organizationFilter,
      }),
    ]);

    const financeTotals: Record<FinanceTransactionType, string> = {
      [FinanceTransactionType.INVOICE]: '0.00',
      [FinanceTransactionType.PAYMENT]: '0.00',
      [FinanceTransactionType.REFUND]: '0.00',
      [FinanceTransactionType.EXPENSE]: '0.00',
    };

    for (const item of financeGroups) {
      const amount = item._sum.amount;
      if (amount) {
        const decimal = amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount);
        financeTotals[item.type] = decimal.toFixed(2);
      }
    }

    return {
      students,
      teachers,
      admissionsPending: admissions,
      finance: financeTotals,
    };
  }

  async getRecentAdmissions(user: SessionUserData): Promise<DashboardAdmissionItem[]> {
    const where = {
      ...(this.branchFilter(user) ?? this.organizationFilter(user)),
    };

    const admissions = await this.prisma.admission.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
      orderBy: { appliedAt: 'desc' },
      take: 5,
    });

    return admissions.map((admission) => ({
      id: admission.id,
      studentName:
        `${admission.student.user.firstName} ${admission.student.user.lastName}`.trim(),
      status: admission.status,
      branchName: admission.branch.name,
      appliedAt: admission.appliedAt,
    }));
  }

  async getRecentFinance(user: SessionUserData): Promise<DashboardFinanceItem[]> {
    const where = {
      ...(this.branchFilter(user) ?? this.organizationFilter(user)),
    };

    const transactions = await this.prisma.financeTransaction.findMany({
      where,
      include: { branch: true },
      orderBy: { occurredAt: 'desc' },
      take: 5,
    });

    return transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toFixed(2),
      occurredAt: transaction.occurredAt,
      branchName: transaction.branch.name,
    }));
  }

  private branchFilter(user: SessionUserData) {
    return user.branchId
      ? {
          branchId: user.branchId,
        }
      : null;
  }

  private organizationFilter(user: SessionUserData) {
    return user.orgId
      ? {
          branch: {
            organizationId: user.orgId,
          },
        }
      : {};
  }
}
