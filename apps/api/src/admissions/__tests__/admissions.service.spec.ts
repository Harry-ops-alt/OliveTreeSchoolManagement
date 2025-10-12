import { AdmissionApplicationStatus } from '@prisma/client';
import { AdmissionsService } from '../admissions.service';
import type { AdmissionsTasksService } from '../admissions.tasks.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { SessionUserData } from '../../users/users.service';

describe('AdmissionsService automation', () => {
  const baseUser: SessionUserData = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'SUPER_ADMIN' as any,
    orgId: 'org-1',
    branchId: null,
  };

  let prismaMock: {
    admissionApplication: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let tasksServiceMock: {
    cancelOpenApplicationAutomationTasks: jest.Mock;
    createApplicationAutomationTask: jest.Mock;
  };

  let service: AdmissionsService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-02-01T10:00:00.000Z'));

    prismaMock = {
      admissionApplication: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    tasksServiceMock = {
      cancelOpenApplicationAutomationTasks: jest.fn(),
      createApplicationAutomationTask: jest.fn(),
    };

    service = new AdmissionsService(
      prismaMock as unknown as PrismaService,
      tasksServiceMock as unknown as AdmissionsTasksService,
    );

    jest.spyOn(service as any, 'ensureLeadAccess').mockResolvedValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('stamps submittedAt and creates automation tasks when creating a submitted application', async () => {
    const createdApplication = {
      id: 'app-1',
      leadId: 'lead-1',
      status: AdmissionApplicationStatus.SUBMITTED,
      branchId: null,
      reviewedById: null,
      lead: {
        branchId: 'branch-1',
        assignedStaffId: 'staff-1',
      },
    };

    const txMock = {
      admissionApplication: {
        create: jest.fn().mockResolvedValue(createdApplication),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(txMock));

    const dto = {
      leadId: 'lead-1',
      status: AdmissionApplicationStatus.SUBMITTED,
    };

    const result = await service.createApplication(baseUser, dto as any);

    expect(txMock.admissionApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leadId: 'lead-1',
          status: AdmissionApplicationStatus.SUBMITTED,
          submittedAt: new Date('2025-02-01T10:00:00.000Z'),
        }),
      }),
    );
    expect(tasksServiceMock.cancelOpenApplicationAutomationTasks).not.toHaveBeenCalled();
    expect(tasksServiceMock.createApplicationAutomationTask).toHaveBeenCalledTimes(1);
    expect(tasksServiceMock.createApplicationAutomationTask.mock.calls[0][0]).toBe(txMock);
    expect(tasksServiceMock.createApplicationAutomationTask.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        automationKey: 'review',
        applicationId: 'app-1',
        leadId: 'lead-1',
        now: new Date('2025-02-01T10:00:00.000Z'),
      }),
    );
    expect(result).toBe(createdApplication);
  });

  it('cancels automation tasks and stamps decisionAt when rejecting an application', async () => {
    const existingApplication = {
      id: 'app-2',
      leadId: 'lead-1',
      status: AdmissionApplicationStatus.SUBMITTED,
      branchId: 'branch-1',
      reviewedById: 'reviewer-1',
      decisionAt: null,
      lead: {
        branchId: 'branch-1',
        assignedStaffId: 'staff-1',
      },
    };

    prismaMock.admissionApplication.findUnique.mockResolvedValue(existingApplication);

    const updatedApplication = {
      ...existingApplication,
      status: AdmissionApplicationStatus.REJECTED,
    };

    const txMock = {
      admissionApplication: {
        update: jest.fn().mockResolvedValue(updatedApplication),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(txMock));

    const dto = {
      status: AdmissionApplicationStatus.REJECTED,
    };

    const result = await service.updateApplication(baseUser, 'app-2', dto as any);

    expect(prismaMock.admissionApplication.findUnique).toHaveBeenCalledWith({
      where: { id: 'app-2' },
      include: expect.any(Object),
    });
    expect(txMock.admissionApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app-2' },
        data: expect.objectContaining({
          status: AdmissionApplicationStatus.REJECTED,
          decisionAt: new Date('2025-02-01T10:00:00.000Z'),
        }),
      }),
    );
    expect(tasksServiceMock.cancelOpenApplicationAutomationTasks).toHaveBeenCalledTimes(1);
    expect(tasksServiceMock.createApplicationAutomationTask).not.toHaveBeenCalled();
    expect(result).toBe(updatedApplication);
  });
});
