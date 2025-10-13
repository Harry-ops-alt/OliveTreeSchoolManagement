import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { FeeStructuresService } from './fee-structures.service';
import { BillingCycle } from '@prisma/client';

const mockOrganization = {
  id: 'org-1',
  name: 'Test School',
};

const mockBranch = {
  id: 'branch-1',
  name: 'Main Campus',
  organizationId: 'org-1',
};

const mockClass = {
  id: 'class-1',
  name: 'Year 6 A',
  code: 'Y6A',
  branchId: 'branch-1',
  isDeleted: false,
};

const mockFeeStructure = {
  id: 'fee-1',
  organizationId: 'org-1',
  branchId: 'branch-1',
  classId: null,
  name: 'Monthly Tuition',
  description: 'Standard monthly tuition fee',
  amount: 500,
  currency: 'GBP',
  billingCycle: BillingCycle.MONTHLY,
  yearGroup: 'Year 6',
  active: true,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  organization: mockOrganization,
  branch: mockBranch,
  class: null,
};

describe('FeeStructuresService', () => {
  let prisma: any;
  let service: FeeStructuresService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (ops: any[]) => {
        return Promise.all(ops.map((op) => op));
      }),
      feeStructure: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
      },
      branch: {
        findFirst: jest.fn(),
      },
      class: {
        findFirst: jest.fn(),
      },
      subscription: {
        count: jest.fn(),
      },
    };
    service = new FeeStructuresService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('returns paginated fee structures with filters', async () => {
      prisma.feeStructure.findMany.mockResolvedValue([mockFeeStructure]);
      prisma.feeStructure.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 10,
        q: 'tuition',
        branchId: 'branch-1',
        active: 'true',
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(prisma.feeStructure.findMany).toHaveBeenCalled();
    });

    it('filters by billing cycle and year group', async () => {
      prisma.feeStructure.findMany.mockResolvedValue([mockFeeStructure]);
      prisma.feeStructure.count.mockResolvedValue(1);

      await service.list({
        billingCycle: BillingCycle.MONTHLY,
        yearGroup: 'Year 6',
      });

      const callArgs = prisma.feeStructure.findMany.mock.calls[0][0];
      expect(callArgs.where.billingCycle).toBe(BillingCycle.MONTHLY);
      expect(callArgs.where.yearGroup).toBe('Year 6');
    });
  });

  describe('getById', () => {
    it('returns fee structure by id', async () => {
      prisma.feeStructure.findUnique.mockResolvedValue({
        ...mockFeeStructure,
        subscriptions: [],
      });

      const result = await service.getById('fee-1');

      expect(result.id).toBe('fee-1');
      expect(prisma.feeStructure.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fee-1' },
        }),
      );
    });

    it('throws NotFoundException when fee structure not found', async () => {
      prisma.feeStructure.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates fee structure with valid data', async () => {
      prisma.organization.findUnique.mockResolvedValue(mockOrganization);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.feeStructure.findFirst.mockResolvedValue(null);
      prisma.feeStructure.create.mockResolvedValue(mockFeeStructure);

      const dto = {
        organizationId: 'org-1',
        branchId: 'branch-1',
        name: 'Monthly Tuition',
        description: 'Standard monthly tuition fee',
        amount: 500,
        billingCycle: BillingCycle.MONTHLY,
        yearGroup: 'Year 6',
      };

      const result = await service.create(dto);

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({ where: { id: 'org-1' } });
      expect(prisma.branch.findFirst).toHaveBeenCalled();
      expect(prisma.feeStructure.create).toHaveBeenCalled();
      expect(result).toEqual(mockFeeStructure);
    });

    it('throws BadRequestException when organization not found', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      const dto = {
        organizationId: 'missing',
        name: 'Test Fee',
        amount: 100,
        billingCycle: BillingCycle.MONTHLY,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('validates branch belongs to organization', async () => {
      prisma.organization.findUnique.mockResolvedValue(mockOrganization);
      prisma.branch.findFirst.mockResolvedValue(null);

      const dto = {
        organizationId: 'org-1',
        branchId: 'wrong-branch',
        name: 'Test Fee',
        amount: 100,
        billingCycle: BillingCycle.MONTHLY,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('validates class exists and belongs to branch', async () => {
      prisma.organization.findUnique.mockResolvedValue(mockOrganization);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.class.findFirst.mockResolvedValue(null);

      const dto = {
        organizationId: 'org-1',
        branchId: 'branch-1',
        classId: 'missing-class',
        name: 'Test Fee',
        amount: 100,
        billingCycle: BillingCycle.MONTHLY,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('prevents duplicate fee structure names', async () => {
      prisma.organization.findUnique.mockResolvedValue(mockOrganization);
      prisma.feeStructure.findFirst.mockResolvedValue(mockFeeStructure);

      const dto = {
        organizationId: 'org-1',
        name: 'Monthly Tuition',
        amount: 500,
        billingCycle: BillingCycle.MONTHLY,
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates fee structure', async () => {
      prisma.feeStructure.findUnique.mockResolvedValue(mockFeeStructure);
      prisma.feeStructure.update.mockResolvedValue({
        ...mockFeeStructure,
        amount: 600,
      });

      const dto = {
        amount: 600,
      };

      const result = await service.update('fee-1', dto);

      expect(prisma.feeStructure.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fee-1' },
        }),
      );
      expect(result.amount).toBe(600);
    });

    it('throws NotFoundException when fee structure not found', async () => {
      prisma.feeStructure.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('archives fee structure with no active subscriptions', async () => {
      prisma.feeStructure.findUnique.mockResolvedValue(mockFeeStructure);
      prisma.subscription.count.mockResolvedValue(0);
      prisma.feeStructure.update.mockResolvedValue({
        ...mockFeeStructure,
        active: false,
      });

      const result = await service.archive('fee-1');

      expect(prisma.subscription.count).toHaveBeenCalledWith({
        where: {
          feeStructureId: 'fee-1',
          status: 'ACTIVE',
        },
      });
      expect(prisma.feeStructure.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'fee-1' },
          data: { active: false },
        }),
      );
      expect(result.active).toBe(false);
    });

    it('throws BadRequestException when active subscriptions exist', async () => {
      prisma.feeStructure.findUnique.mockResolvedValue(mockFeeStructure);
      prisma.subscription.count.mockResolvedValue(5);

      await expect(service.archive('fee-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when fee structure not found', async () => {
      prisma.feeStructure.findUnique.mockResolvedValue(null);

      await expect(service.archive('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
