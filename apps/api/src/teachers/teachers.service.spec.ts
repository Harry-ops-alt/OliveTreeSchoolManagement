import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { TeachersService } from './teachers.service';

const mockBranch = {
  id: 'branch-1',
  name: 'Main Campus',
};

const mockUser = {
  id: 'user-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  role: 'TEACHER',
};

const mockTeacherProfile = {
  id: 'teacher-1',
  userId: 'user-1',
  branchId: 'branch-1',
  hireDate: new Date('2024-01-01'),
  subjects: ['Mathematics', 'Physics'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockUser,
  branch: mockBranch,
  classSchedules: [],
};

describe('TeachersService', () => {
  let prisma: any;
  let service: TeachersService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (ops: any[]) => {
        return Promise.all(ops.map((op) => op));
      }),
      teacherProfile: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      branch: {
        findUnique: jest.fn(),
      },
    };
    service = new TeachersService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('returns paginated teachers with filters', async () => {
      prisma.teacherProfile.findMany.mockResolvedValue([mockTeacherProfile]);
      prisma.teacherProfile.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        pageSize: 10,
        q: 'jane',
        branchId: 'branch-1',
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(prisma.teacherProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('filters by subject', async () => {
      prisma.teacherProfile.findMany.mockResolvedValue([mockTeacherProfile]);
      prisma.teacherProfile.count.mockResolvedValue(1);

      await service.list({ subject: 'Mathematics' });

      const callArgs = prisma.teacherProfile.findMany.mock.calls[0][0];
      expect(callArgs.where.subjects).toEqual({ has: 'Mathematics' });
    });

    it('searches by user name and email', async () => {
      prisma.teacherProfile.findMany.mockResolvedValue([mockTeacherProfile]);
      prisma.teacherProfile.count.mockResolvedValue(1);

      await service.list({ q: 'jane' });

      const callArgs = prisma.teacherProfile.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR.length).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('returns teacher by id', async () => {
      prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);

      const result = await service.getById('teacher-1');

      expect(result.id).toBe('teacher-1');
      expect(prisma.teacherProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'teacher-1' },
        }),
      );
    });

    it('throws NotFoundException when teacher not found', async () => {
      prisma.teacherProfile.findUnique.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates teacher with valid data', async () => {
      prisma.branch.findUnique.mockResolvedValue(mockBranch);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.teacherProfile.findUnique.mockResolvedValue(null);
      prisma.teacherProfile.create.mockResolvedValue(mockTeacherProfile);

      const dto = {
        userId: 'user-1',
        branchId: 'branch-1',
        hireDate: '2024-01-01',
        subjects: ['Mathematics', 'Physics'],
      };

      const result = await service.create(dto);

      expect(prisma.branch.findUnique).toHaveBeenCalledWith({ where: { id: 'branch-1' } });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(prisma.teacherProfile.create).toHaveBeenCalled();
      expect(result).toEqual(mockTeacherProfile);
    });

    it('throws BadRequestException when branch not found', async () => {
      prisma.branch.findUnique.mockResolvedValue(null);

      const dto = {
        userId: 'user-1',
        branchId: 'missing',
        subjects: [],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when user not found', async () => {
      prisma.branch.findUnique.mockResolvedValue(mockBranch);
      prisma.user.findUnique.mockResolvedValue(null);

      const dto = {
        userId: 'missing',
        branchId: 'branch-1',
        subjects: [],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when user already has teacher profile', async () => {
      prisma.branch.findUnique.mockResolvedValue(mockBranch);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);

      const dto = {
        userId: 'user-1',
        branchId: 'branch-1',
        subjects: [],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates teacher profile', async () => {
      prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
      prisma.branch.findUnique.mockResolvedValue(mockBranch);
      prisma.teacherProfile.update.mockResolvedValue({
        ...mockTeacherProfile,
        subjects: ['Chemistry', 'Biology'],
      });

      const dto = {
        subjects: ['Chemistry', 'Biology'],
      };

      const result = await service.update('teacher-1', dto);

      expect(prisma.teacherProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'teacher-1' },
        }),
      );
      expect(result.subjects).toEqual(['Chemistry', 'Biology']);
    });

    it('validates new branch when changing branch', async () => {
      prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
      prisma.branch.findUnique.mockResolvedValue({ id: 'branch-2', name: 'Other Branch' });
      prisma.teacherProfile.update.mockResolvedValue({
        ...mockTeacherProfile,
        branchId: 'branch-2',
      });

      const dto = {
        branchId: 'branch-2',
      };

      await service.update('teacher-1', dto);

      expect(prisma.branch.findUnique).toHaveBeenCalledWith({ where: { id: 'branch-2' } });
    });

    it('throws NotFoundException when teacher not found', async () => {
      prisma.teacherProfile.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes teacher profile', async () => {
      prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
      prisma.teacherProfile.delete.mockResolvedValue(mockTeacherProfile);

      const result = await service.remove('teacher-1');

      expect(prisma.teacherProfile.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'teacher-1' },
        }),
      );
      expect(result.id).toBe('teacher-1');
    });

    it('throws NotFoundException when teacher not found', async () => {
      prisma.teacherProfile.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
