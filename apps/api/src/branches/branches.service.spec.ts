import { NotFoundException } from '@nestjs/common';
import { BranchesService } from './branches.service';
import type { PrismaService } from '../prisma/prisma.service';

const mockBranch = {
  id: 'branch-1',
  name: 'Central Campus',
  organizationId: 'org-1',
};

const mockClassroom = {
  id: 'room-1',
  branchId: 'branch-1',
  name: 'Room A',
};

describe('BranchesService', () => {
  let prisma: {
    branch: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    classroom: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    teacherProfile: {
      findMany: jest.Mock;
    };
    organization: {
      findFirst: jest.Mock;
    };
  };
  let service: BranchesService;

  beforeEach(() => {
    prisma = {
      branch: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      classroom: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      teacherProfile: {
        findMany: jest.fn(),
      },
      organization: {
        findFirst: jest.fn(),
      },
    };

    service = new BranchesService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a branch with mapped payload and default organization', async () => {
    const dto = {
      name: 'East Campus',
      email: 'east@example.com',
      notes: 'STEM focus',
      addressLine1: '123 East Ave',
    };
    prisma.organization.findFirst.mockResolvedValue({ id: 'org-1' });
    const createdBranch = { ...mockBranch, ...dto, id: 'branch-2' };
    prisma.branch.create.mockResolvedValue(createdBranch);

    const result = await service.createBranch(dto as any);

    expect(prisma.organization.findFirst).toHaveBeenCalled();
    expect(prisma.branch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        name: dto.name,
        email: dto.email,
        notes: dto.notes,
        addressLine1: dto.addressLine1,
      }),
    });
    expect(result).toEqual(createdBranch);
  });

  it('returns existing branch when no update fields are provided', async () => {
    prisma.branch.findUnique.mockResolvedValue(mockBranch);

    const result = await service.updateBranch(mockBranch.id, {} as any);

    expect(result).toBe(mockBranch);
    expect(prisma.branch.update).not.toHaveBeenCalled();
  });

  it('updates branch when fields are provided', async () => {
    prisma.branch.findUnique.mockResolvedValue(mockBranch);
    const updatedBranch = { ...mockBranch, name: 'Updated Campus' };
    prisma.branch.update.mockResolvedValue(updatedBranch);

    const result = await service.updateBranch(mockBranch.id, { name: 'Updated Campus' } as any);

    expect(prisma.branch.update).toHaveBeenCalledWith({
      where: { id: mockBranch.id },
      data: { name: 'Updated Campus' },
    });
    expect(result).toBe(updatedBranch);
  });

  it('creates a classroom and maps location/notes into description', async () => {
    prisma.branch.findUnique.mockResolvedValue(mockBranch);
    const classroomDto = {
      name: 'Studio 1',
      capacity: 18,
      location: 'First floor',
      notes: 'Equipped with piano',
    };
    prisma.classroom.create.mockResolvedValue(mockClassroom);

    const result = await service.createClassroom(mockBranch.id, classroomDto as any);

    expect(prisma.classroom.create).toHaveBeenCalledWith({
      data: {
        branchId: mockBranch.id,
        name: classroomDto.name,
        capacity: classroomDto.capacity,
        description: 'Location: First floor\n\nEquipped with piano',
      },
    });
    expect(result).toEqual(mockClassroom);
  });

  it('throws when removing a classroom that does not exist in branch', async () => {
    prisma.branch.findUnique.mockResolvedValue(mockBranch);
    prisma.classroom.findFirst.mockResolvedValue(null);

    await expect(service.removeClassroom(mockBranch.id, 'missing-room')).rejects.toThrow(NotFoundException);
    expect(prisma.classroom.delete).not.toHaveBeenCalled();
  });

  it('removes a classroom when found', async () => {
    prisma.branch.findUnique.mockResolvedValue(mockBranch);
    prisma.classroom.findFirst.mockResolvedValue(mockClassroom);
    prisma.classroom.delete.mockResolvedValue(mockClassroom);

    const result = await service.removeClassroom(mockBranch.id, mockClassroom.id);

    expect(prisma.classroom.delete).toHaveBeenCalledWith({ where: { id: mockClassroom.id } });
    expect(result).toEqual(mockClassroom);
  });
});
