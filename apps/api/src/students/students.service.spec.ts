import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from './students.service';
import type { SessionUserData } from '../users/users.service';
import { Role, StudentStatus, Gender } from '@prisma/client';

const mockBranch = {
  id: 'branch-1',
  name: 'Main Campus',
  organizationId: 'org-1',
};

const mockUser = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
};

const mockStudentProfile = {
  id: 'student-1',
  userId: 'user-1',
  branchId: 'branch-1',
  classroomId: 'room-1',
  studentNumber: 'STU001',
  dateJoined: new Date('2024-01-01'),
  email: 'john.doe@example.com',
  phone: null,
  alternatePhone: null,
  enrollmentDate: new Date('2024-01-01'),
  status: StudentStatus.ENROLLED,
  dateOfBirth: new Date('2010-05-15'),
  gender: Gender.MALE,
  gradeLevel: 'Year 6',
  homeroom: null,
  primaryLanguage: 'English',
  additionalSupportNotes: null,
  medicalNotes: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  notes: null,
  isArchived: false,
  archivedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: mockUser,
  branch: mockBranch,
  classroom: { id: 'room-1', name: 'Room A', branchId: 'branch-1' },
  guardians: [],
  admissions: [],
  classEnrollments: [],
};

const mockSessionUser: SessionUserData = {
  id: 'admin-1',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  role: Role.SCHOOL_ADMIN,
  orgId: 'org-1',
  branchId: 'branch-1',
};

describe('StudentsService', () => {
  let prisma: any;
  let service: StudentsService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: any) => {
        return callback(prisma);
      }),
      studentProfile: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      branch: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      classroom: {
        findFirst: jest.fn(),
      },
      classSchedule: {
        findMany: jest.fn(),
      },
      guardian: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      studentGuardian: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      studentClassEnrollment: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };
    service = new StudentsService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('list', () => {
    it('returns paginated students with filters', async () => {
      prisma.studentProfile.findMany.mockResolvedValue([mockStudentProfile]);
      prisma.studentProfile.count.mockResolvedValue(1);
      prisma.branch.findUnique.mockResolvedValue(mockBranch);

      const result = await service.list(mockSessionUser, {
        page: 1,
        pageSize: 10,
        search: 'john',
        branchId: 'branch-1',
        includeArchived: false,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(prisma.studentProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('filters by status and grade level', async () => {
      prisma.studentProfile.findMany.mockResolvedValue([mockStudentProfile]);
      prisma.studentProfile.count.mockResolvedValue(1);

      await service.list(mockSessionUser, {
        status: StudentStatus.ENROLLED,
        gradeLevel: 'Year 6',
      });

      expect(prisma.studentProfile.findMany).toHaveBeenCalled();
      expect(prisma.studentProfile.count).toHaveBeenCalled();
    });

    it('excludes archived students by default', async () => {
      prisma.studentProfile.findMany.mockResolvedValue([]);
      prisma.studentProfile.count.mockResolvedValue(0);

      await service.list(mockSessionUser, { includeArchived: false });

      const callArgs = prisma.studentProfile.findMany.mock.calls[0][0];
      expect(callArgs.where.isArchived).toBe(false);
    });
  });

  describe('getById', () => {
    it('returns student by id when authorized', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(mockStudentProfile);

      const result = await service.getById(mockSessionUser, 'student-1');

      expect(result.id).toBe('student-1');
      expect(prisma.studentProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'student-1' },
        }),
      );
    });

    it('throws NotFoundException when student not found', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.getById(mockSessionUser, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user lacks access', async () => {
      const unauthorizedUser: SessionUserData = {
        ...mockSessionUser,
        orgId: 'other-org',
      };
      prisma.studentProfile.findUnique.mockResolvedValue(mockStudentProfile);

      await expect(service.getById(unauthorizedUser, 'student-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('creates student with valid data', async () => {
      prisma.branch.findUnique.mockResolvedValue(mockBranch);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-new',
        organizationId: 'org-1',
        branchId: null,
      });
      prisma.classroom.findFirst.mockResolvedValue({ id: 'room-1', branchId: 'branch-1' });
      prisma.classSchedule.findMany.mockResolvedValue([]);
      prisma.studentProfile.create.mockResolvedValue(mockStudentProfile);
      prisma.studentGuardian.deleteMany.mockResolvedValue({ count: 0 });
      prisma.studentGuardian.createMany.mockResolvedValue({ count: 0 });
      prisma.studentClassEnrollment.deleteMany.mockResolvedValue({ count: 0 });
      prisma.studentClassEnrollment.createMany.mockResolvedValue({ count: 0 });

      const dto = {
        userId: 'user-new',
        branchId: 'branch-1',
        orgId: 'org-1',
        studentNumber: 'STU002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        status: StudentStatus.ENROLLED,
        classroomId: 'room-1',
        guardians: [],
        classScheduleIds: [],
      };

      const result = await service.create(mockSessionUser, dto);

      expect(prisma.studentProfile.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws BadRequestException when userId missing', async () => {
      const dto: any = {
        branchId: 'branch-1',
        orgId: 'org-1',
        studentNumber: 'STU003',
      };

      await expect(service.create(mockSessionUser, dto)).rejects.toThrow(BadRequestException);
    });

    it('validates classroom belongs to branch', async () => {
      prisma.branch.findUnique.mockResolvedValue(mockBranch);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-new',
        organizationId: 'org-1',
        branchId: null,
      });
      prisma.classroom.findFirst.mockResolvedValue(null);

      const dto = {
        userId: 'user-new',
        branchId: 'branch-1',
        orgId: 'org-1',
        studentNumber: 'STU004',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        status: StudentStatus.ENROLLED,
        classroomId: 'wrong-room',
        guardians: [],
        classScheduleIds: [],
      };

      await expect(service.create(mockSessionUser, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates student profile', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(mockStudentProfile);
      prisma.branch.findUnique.mockResolvedValue(mockBranch);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.classroom.findFirst.mockResolvedValue({ id: 'room-2', branchId: 'branch-1' });
      prisma.classSchedule.findMany.mockResolvedValue([]);
      prisma.studentProfile.update.mockResolvedValue({
        ...mockStudentProfile,
        classroomId: 'room-2',
      });
      prisma.studentGuardian.deleteMany.mockResolvedValue({ count: 0 });
      prisma.studentGuardian.createMany.mockResolvedValue({ count: 0 });
      prisma.studentClassEnrollment.deleteMany.mockResolvedValue({ count: 0 });
      prisma.studentClassEnrollment.createMany.mockResolvedValue({ count: 0 });

      const dto = {
        classroomId: 'room-2',
        gradeLevel: 'Year 7',
      };

      const result = await service.update(mockSessionUser, 'student-1', dto);

      expect(prisma.studentProfile.update).toHaveBeenCalled();
      expect(result.classroomId).toBe('room-2');
    });

    it('throws NotFoundException when student not found', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.update(mockSessionUser, 'missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('archive', () => {
    it('archives student by setting isArchived flag', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(mockStudentProfile);
      prisma.studentProfile.update.mockResolvedValue({
        ...mockStudentProfile,
        isArchived: true,
        archivedAt: new Date(),
      });

      const result = await service.archive(mockSessionUser, 'student-1');

      expect(prisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        data: {
          isArchived: true,
          archivedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result.isArchived).toBe(true);
    });

    it('throws NotFoundException when student not found', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.archive(mockSessionUser, 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
