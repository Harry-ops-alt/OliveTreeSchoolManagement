import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from './subscriptions.service';
import { BillingCycle, SubscriptionStatus } from '@prisma/client';

const mockStudent = {
  id: 'student-1',
  userId: 'user-1',
  studentNumber: 'STU001',
  user: {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  guardians: [
    {
      guardianId: 'guardian-1',
      guardian: {
        id: 'guardian-1',
        firstName: 'Jane',
        lastName: 'Doe',
      },
    },
  ],
};

const mockFeeStructure = {
  id: 'fee-1',
  name: 'Monthly Tuition',
  amount: 500,
  currency: 'GBP',
  billingCycle: BillingCycle.MONTHLY,
  active: true,
};

const mockSubscription = {
  id: 'sub-1',
  studentId: 'student-1',
  feeStructureId: 'fee-1',
  startDate: new Date('2025-01-01'),
  endDate: null,
  status: SubscriptionStatus.ACTIVE,
  amount: 500,
  discountAmount: 0,
  discountReason: null,
  billingCycle: BillingCycle.MONTHLY,
  nextBillingDate: new Date('2025-02-01'),
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  student: mockStudent,
  feeStructure: mockFeeStructure,
};

describe('SubscriptionsService', () => {
  let prisma: any;
  let service: SubscriptionsService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (ops: any[]) => {
        return Promise.all(ops.map((op) => op));
      }),
      subscription: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      studentProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      feeStructure: {
        findUnique: jest.fn(),
      },
    };
    service = new SubscriptionsService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('returns paginated subscriptions with filters', async () => {
      prisma.subscription.findMany.mockResolvedValue([mockSubscription]);
      prisma.subscription.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 10,
        studentId: 'student-1',
        status: SubscriptionStatus.ACTIVE,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(prisma.subscription.findMany).toHaveBeenCalled();
    });

    it('filters by branch and search query', async () => {
      prisma.subscription.findMany.mockResolvedValue([mockSubscription]);
      prisma.subscription.count.mockResolvedValue(1);

      await service.list({
        q: 'john',
        branchId: 'branch-1',
      });

      const callArgs = prisma.subscription.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.student.branchId).toBe('branch-1');
    });
  });

  describe('getById', () => {
    it('returns subscription by id with invoices', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        invoices: [],
      });

      const result = await service.getById('sub-1');

      expect(result.id).toBe('sub-1');
      expect(prisma.subscription.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
        }),
      );
    });

    it('throws NotFoundException when subscription not found', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates subscription with valid data', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(mockStudent);
      prisma.feeStructure.findUnique.mockResolvedValue(mockFeeStructure);
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.studentProfile.findMany.mockResolvedValue([]); // No siblings
      prisma.subscription.create.mockResolvedValue(mockSubscription);

      const dto = {
        studentId: 'student-1',
        feeStructureId: 'fee-1',
        startDate: '2025-01-01',
      };

      const result = await service.create(dto);

      expect(prisma.studentProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'student-1' },
        }),
      );
      expect(prisma.feeStructure.findUnique).toHaveBeenCalledWith({
        where: { id: 'fee-1' },
      });
      expect(prisma.subscription.create).toHaveBeenCalled();
      expect(result).toEqual(mockSubscription);
    });

    it('throws BadRequestException when student not found', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(null);

      const dto = {
        studentId: 'missing',
        feeStructureId: 'fee-1',
        startDate: '2025-01-01',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when fee structure not found', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(mockStudent);
      prisma.feeStructure.findUnique.mockResolvedValue(null);

      const dto = {
        studentId: 'student-1',
        feeStructureId: 'missing',
        startDate: '2025-01-01',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when fee structure is inactive', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(mockStudent);
      prisma.feeStructure.findUnique.mockResolvedValue({
        ...mockFeeStructure,
        active: false,
      });

      const dto = {
        studentId: 'student-1',
        feeStructureId: 'fee-1',
        startDate: '2025-01-01',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('prevents duplicate active subscriptions', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(mockStudent);
      prisma.feeStructure.findUnique.mockResolvedValue(mockFeeStructure);
      prisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const dto = {
        studentId: 'student-1',
        feeStructureId: 'fee-1',
        startDate: '2025-01-01',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('applies sibling discount automatically', async () => {
      const sibling = {
        id: 'student-2',
        guardians: [{ guardianId: 'guardian-1' }],
        subscriptions: [{ status: SubscriptionStatus.ACTIVE }],
      };

      prisma.studentProfile.findUnique.mockResolvedValue(mockStudent);
      prisma.feeStructure.findUnique.mockResolvedValue(mockFeeStructure);
      prisma.subscription.findFirst.mockResolvedValue(null);
      prisma.studentProfile.findMany.mockResolvedValue([sibling]);
      prisma.subscription.create.mockResolvedValue({
        ...mockSubscription,
        discountAmount: 10,
        discountReason: '10% sibling discount (1 sibling)',
      });

      const dto = {
        studentId: 'student-1',
        feeStructureId: 'fee-1',
        startDate: '2025-01-01',
      };

      await service.create(dto);

      expect(prisma.studentProfile.findMany).toHaveBeenCalled();
      expect(prisma.subscription.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      prisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.PAUSED,
      });

      const dto = {
        status: SubscriptionStatus.PAUSED,
      };

      const result = await service.update('sub-1', dto);

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
        }),
      );
      expect(result.status).toBe(SubscriptionStatus.PAUSED);
    });

    it('throws NotFoundException when subscription not found', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancels active subscription', async () => {
      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      prisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        endDate: new Date(),
      });

      const result = await service.cancel('sub-1', 'Student withdrew');

      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({
            status: SubscriptionStatus.CANCELLED,
          }),
        }),
      );
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });

    it('throws BadRequestException when already cancelled', async () => {
      prisma.subscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      });

      await expect(service.cancel('sub-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when subscription not found', async () => {
      prisma.subscription.findUnique.mockResolvedValue(null);

      await expect(service.cancel('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
