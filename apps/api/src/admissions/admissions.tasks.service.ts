import { Injectable } from '@nestjs/common';
import { AdmissionTaskStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NoShowTaskParams {
  leadId: string;
  sessionId: string;
  sessionTitle: string;
  sessionStart: Date;
  branchId: string;
  now: Date;
}

export interface ApplicationTaskParams {
  automationKey: string;
  leadId: string;
  applicationId: string;
  branchId?: string | null;
  assigneeId?: string | null;
  title: string;
  description: string;
  dueInDays: number;
  now: Date;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdmissionsTasksService {
  constructor(private readonly prisma: PrismaService) {}

  async createNoShowFollowUp(tx: Prisma.TransactionClient, params: NoShowTaskParams): Promise<void> {
    const metadata: Prisma.InputJsonValue = {
      automation: 'taster-no-show',
      sessionId: params.sessionId,
      branchId: params.branchId,
    };

    await tx.admissionTask.create({
      data: {
        leadId: params.leadId,
        title: `Follow up: missed taster ${params.sessionTitle}`,
        description: `Automated follow-up generated after taster session on ${params.sessionStart.toISOString()}`,
        dueAt: new Date(params.now.getTime() + DAY_IN_MS),
        metadata,
      },
    });
  }

  async createApplicationAutomationTask(tx: Prisma.TransactionClient, params: ApplicationTaskParams): Promise<void> {
    const metadata: Prisma.InputJsonValue = {
      automation: 'application-status',
      key: params.automationKey,
    };

    await tx.admissionTask.create({
      data: {
        leadId: params.leadId,
        applicationId: params.applicationId,
        title: params.title,
        description: params.description,
        assigneeId: params.assigneeId ?? null,
        dueAt: new Date(params.now.getTime() + params.dueInDays * DAY_IN_MS),
        metadata,
      },
    });
  }

  async cancelOpenApplicationAutomationTasks(tx: Prisma.TransactionClient, applicationId: string): Promise<void> {
    await tx.admissionTask.updateMany({
      where: {
        applicationId,
        status: { in: [AdmissionTaskStatus.PENDING, AdmissionTaskStatus.IN_PROGRESS] },
        metadata: {
          path: ['automation'],
          equals: 'application-status',
        },
      },
      data: {
        status: AdmissionTaskStatus.CANCELLED,
        completedAt: null,
      },
    });
  }
}
