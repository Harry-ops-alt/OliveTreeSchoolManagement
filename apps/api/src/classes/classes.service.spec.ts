import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { ClassesService } from './classes.service';

const mockClass = {
  id: 'class-1',
  branchId: 'branch-1',
  classroomId: 'room-1',
  name: 'Year 6 A',
  code: 'Y6A',
  capacity: 25,
  yearGroup: 'Year 6',
  startDate: new Date('2024-09-01T00:00:00.000Z'),
  endDate: null,
  active: true,
  metadata: null,
  isDeleted: false,
  deletedAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('ClassesService', () => {
  let prisma: any;
  let service: ClassesService;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (ops: any[]) => {
        return Promise.all(ops.map((op) => op));
      }),
      class: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      branch: {
        findUnique: jest.fn(),
      },
      classroom: {
        findFirst: jest.fn(),
      },
    };
    service = new ClassesService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('lists with pagination and filters', async () => {
    prisma.class.findMany.mockResolvedValue([mockClass]);
    prisma.class.count.mockResolvedValue(1);

    const result = await service.list({ q: 'year', page: 2, pageSize: 10, active: 'true' } as any);

    expect(prisma.class.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.total).toBe(1);
    expect(result.items.length).toBe(1);
  });

  it('gets by id and throws when missing', async () => {
    prisma.class.findFirst.mockResolvedValue(mockClass);
    const item = await service.getById('class-1');
    expect(item.id).toBe('class-1');

    prisma.class.findFirst.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates with referential checks', async () => {
    prisma.branch.findUnique.mockResolvedValue({ id: 'branch-1' });
    prisma.classroom.findFirst.mockResolvedValue({ id: 'room-1', branchId: 'branch-1' });
    prisma.class.create.mockResolvedValue(mockClass);

    const dto = {
      branchId: 'branch-1',
      classroomId: 'room-1',
      name: 'Year 6 A',
      code: 'Y6A',
      capacity: 25,
      active: true,
    };

    const created = await service.create(dto as any);

    expect(prisma.branch.findUnique).toHaveBeenCalledWith({ where: { id: 'branch-1' } });
    expect(prisma.classroom.findFirst).toHaveBeenCalledWith({ where: { id: 'room-1', branchId: 'branch-1' } });
    expect(prisma.class.create).toHaveBeenCalled();
    expect(created).toEqual(mockClass);
  });

  it('rejects create when branch not found', async () => {
    prisma.branch.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ branchId: 'missing', name: 'X', capacity: 0 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates while checking classroom belongs to branch', async () => {
    prisma.class.findFirst.mockResolvedValue(mockClass);
    prisma.classroom.findFirst.mockResolvedValue({ id: 'room-2', branchId: 'branch-1' });
    prisma.class.update.mockResolvedValue({ ...mockClass, classroomId: 'room-2' });

    const updated = await service.update('class-1', { classroomId: 'room-2' } as any);

    expect(prisma.classroom.findFirst).toHaveBeenCalledWith({ where: { id: 'room-2', branchId: 'branch-1' } });
    expect(updated.classroomId).toBe('room-2');
  });

  it('soft deletes the class', async () => {
    prisma.class.findFirst.mockResolvedValue(mockClass);
    prisma.class.update.mockResolvedValue({ ...mockClass, isDeleted: true, active: false });

    const deleted = await service.remove('class-1');

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: 'class-1' },
      data: expect.objectContaining({ isDeleted: true, active: false }),
    });
    expect(deleted.isDeleted).toBe(true);
  });
});
