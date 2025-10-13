import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ListTeachersDto } from './dto/list-teachers.dto';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListTeachersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.TeacherProfileWhereInput = {
      ...(query.q
        ? {
            OR: [
              { user: { firstName: { contains: query.q, mode: 'insensitive' } } },
              { user: { lastName: { contains: query.q, mode: 'insensitive' } } },
              { user: { email: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.subject ? { subjects: { has: query.subject } } : {}),
    };

    const orderBy = this.parseOrder(query.order);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.teacherProfile.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          classSchedules: {
            select: {
              id: true,
              title: true,
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
      this.prisma.teacherProfile.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        classSchedules: {
          include: {
            classroom: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async create(dto: CreateTeacherDto) {
    await this.ensureBranchExists(dto.branchId);
    await this.ensureUserExists(dto.userId);

    const existing = await this.prisma.teacherProfile.findUnique({
      where: { userId: dto.userId },
    });

    if (existing) {
      throw new BadRequestException('User already has a teacher profile');
    }

    const created = await this.prisma.teacherProfile.create({
      data: {
        userId: dto.userId,
        branchId: dto.branchId,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : new Date(),
        subjects: dto.subjects ?? [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return created;
  }

  async update(id: string, dto: UpdateTeacherDto) {
    const existing = await this.prisma.teacherProfile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Teacher not found');

    if (dto.branchId && dto.branchId !== existing.branchId) {
      await this.ensureBranchExists(dto.branchId);
    }

    const data: Prisma.TeacherProfileUpdateInput = {
      ...(dto.branchId ? { branch: { connect: { id: dto.branchId } } } : {}),
      ...(dto.hireDate !== undefined ? { hireDate: new Date(dto.hireDate) } : {}),
      ...(dto.subjects !== undefined ? { subjects: dto.subjects } : {}),
    };

    const updated = await this.prisma.teacherProfile.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.teacherProfile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Teacher not found');

    return this.prisma.teacherProfile.delete({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  private parseOrder(
    order?: string,
  ): Prisma.TeacherProfileOrderByWithRelationInput | Prisma.TeacherProfileOrderByWithRelationInput[] | undefined {
    if (!order) return { user: { lastName: 'asc' } } as any;

    const parts = order.split(',').map((s) => s.trim()).filter(Boolean);
    const parsed = parts
      .map((p) => {
        const [field, dir] = p.split(':');
        const direction = dir?.toLowerCase() === 'asc' ? 'asc' : 'desc';

        if (field === 'user.lastName' || field === 'user.firstName') {
          const userField = field.split('.')[1];
          return { user: { [userField]: direction } } as Prisma.TeacherProfileOrderByWithRelationInput;
        }

        if (field === 'hireDate' || field === 'createdAt') {
          return { [field]: direction } as Prisma.TeacherProfileOrderByWithRelationInput;
        }

        return undefined;
      })
      .filter(Boolean) as Prisma.TeacherProfileOrderByWithRelationInput[];

    return parsed.length > 0 ? parsed : ({ user: { lastName: 'asc' } } as any);
  }

  private async ensureBranchExists(branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new BadRequestException('Branch does not exist');
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User does not exist');
  }
}
