import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { ClassSchedulesService } from './class-schedules.service';
import { StaffAssignmentRole } from '@prisma/client';

describe('ClassSchedulesService', () => {
  let prisma: {
    branch: { findUnique: jest.Mock };
    classroom: { findUnique: jest.Mock };
    teacherProfile: { findUnique: jest.Mock };
    classSchedule: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    staffAssignment: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let service: ClassSchedulesService;

  const baseSchedule = {
    id: 'schedule-1',
    branchId: 'branch-1',
    title: 'Maths',
    description: null,
    dayOfWeek: 'MONDAY' as const,
    startTime: new Date('2024-02-01T09:00:00.000Z'),
    endTime: new Date('2024-02-01T10:00:00.000Z'),
    classroomId: 'room-1',
    teacherProfileId: 'teacher-1',
    classroom: { id: 'room-1', name: 'Room A' },
    teacherProfile: {
      id: 'teacher-1',
      branchId: 'branch-1',
      userId: 'user-1',
      user: {
        id: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      },
    },
    assignments: [],
  };

  beforeEach(() => {
    prisma = {
      branch: { findUnique: jest.fn() },
      classroom: { findUnique: jest.fn() },
      teacherProfile: { findUnique: jest.fn() },
      classSchedule: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      staffAssignment: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb({
        staffAssignment: {
          deleteMany: prisma.staffAssignment.deleteMany,
          createMany: prisma.staffAssignment.createMany,
        },
      })),
    };

    prisma.branch.findUnique.mockResolvedValue({ id: 'branch-1' });

    service = new ClassSchedulesService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('creates a schedule when inputs are valid', async () => {
      prisma.classroom.findUnique.mockResolvedValue({ id: 'room-1', branchId: 'branch-1' });
      prisma.teacherProfile.findUnique.mockResolvedValue({ id: 'teacher-1', branchId: 'branch-1', userId: 'user-1' });
      prisma.classSchedule.findMany.mockResolvedValue([]);
      prisma.classSchedule.create.mockResolvedValue(baseSchedule);

      const result = await service.create('branch-1', {
        title: 'Maths',
        dayOfWeek: 'MONDAY',
        startTime: new Date('2024-02-01T09:00:00.000Z').toISOString(),
        endTime: new Date('2024-02-01T10:00:00.000Z').toISOString(),
        classroomId: 'room-1',
        teacherProfileId: 'teacher-1',
      });

      expect(prisma.classSchedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Maths',
          dayOfWeek: 'MONDAY',
        }),
        include: expect.any(Object),
      });
      expect(prisma.staffAssignment.deleteMany).toHaveBeenCalled();
      expect(result.title).toBe('Maths');
    });

    it('throws conflict when clashes detected', async () => {
      prisma.classroom.findUnique.mockResolvedValue({ id: 'room-1', branchId: 'branch-1' });
      prisma.teacherProfile.findUnique.mockResolvedValue({ id: 'teacher-1', branchId: 'branch-1', userId: 'user-1' });
      prisma.classSchedule.findMany.mockResolvedValue([baseSchedule]);

      await expect(
        service.create('branch-1', {
          title: 'Science',
          dayOfWeek: 'MONDAY',
          startTime: new Date('2024-02-01T09:30:00.000Z').toISOString(),
          endTime: new Date('2024-02-01T10:30:00.000Z').toISOString(),
          classroomId: 'room-1',
          teacherProfileId: 'teacher-1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('updates schedule and refreshes assignments when provided', async () => {
      prisma.classSchedule.findFirst.mockResolvedValue({ ...baseSchedule, assignments: [] });
      prisma.classroom.findUnique.mockResolvedValue({ id: 'room-2', branchId: 'branch-1' });
      prisma.teacherProfile.findUnique.mockResolvedValue({ id: 'teacher-2', branchId: 'branch-1', userId: 'user-2' });
      prisma.classSchedule.findMany.mockResolvedValue([]);
      prisma.classSchedule.update.mockResolvedValue({ ...baseSchedule, classroomId: 'room-2' });

      const result = await service.update('branch-1', 'schedule-1', {
        classroomId: 'room-2',
        primaryInstructor: { userId: 'user-3', role: StaffAssignmentRole.LEAD_TEACHER },
      });

      expect(prisma.classSchedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-1' },
        data: expect.objectContaining({
          classroom: { connect: { id: 'room-2' } },
        }),
        include: expect.any(Object),
      });
      expect(prisma.staffAssignment.deleteMany).toHaveBeenCalledWith({ where: { scheduleId: 'schedule-1' } });
      expect(prisma.staffAssignment.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ userId: 'user-3', role: StaffAssignmentRole.LEAD_TEACHER }),
        ],
      });
      expect(result.classroomId).toBe('room-2');
    });

    it('throws when schedule not found in branch', async () => {
      prisma.classSchedule.findFirst.mockResolvedValue(null);

      await expect(service.update('branch-1', 'missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes schedule and assignments', async () => {
      prisma.classSchedule.findFirst.mockResolvedValue(baseSchedule);
      prisma.classSchedule.delete.mockResolvedValue(baseSchedule);

      const result = await service.remove('branch-1', 'schedule-1');

      expect(prisma.staffAssignment.deleteMany).toHaveBeenCalledWith({ where: { scheduleId: 'schedule-1' } });
      expect(prisma.classSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'schedule-1' },
        include: expect.any(Object),
      });
      expect(result.id).toBe('schedule-1');
    });
  });
});
