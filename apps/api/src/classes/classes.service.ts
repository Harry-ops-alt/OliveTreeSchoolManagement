import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ListClassesDto } from './dto/list-classes.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListClassesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ClassWhereInput = {
      isDeleted: false,
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { code: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.classroomId ? { classroomId: query.classroomId } : {}),
      ...(typeof query.active === 'string' ? { active: query.active === 'true' } : {}),
    };

    const orderBy = this.parseOrder(query.order);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.class.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.class.count({ where }),
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
    const item = await this.prisma.class.findFirst({ where: { id, isDeleted: false } });
    if (!item) throw new NotFoundException('Class not found');
    return item;
    
  }

  async create(dto: CreateClassDto) {
    await this.ensureBranchExists(dto.branchId);
    if (dto.classroomId) {
      await this.ensureClassroomInBranch(dto.classroomId, dto.branchId);
    }

    const created = await this.prisma.class.create({
      data: {
        branchId: dto.branchId,
        classroomId: dto.classroomId ?? null,
        name: dto.name,
        code: dto.code ?? null,
        capacity: dto.capacity,
        yearGroup: dto.yearGroup ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        active: dto.active ?? true,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });

    return created;
  }

  async update(id: string, dto: UpdateClassDto) {
    const existing = await this.prisma.class.findFirst({ where: { id, isDeleted: false } });
    if (!existing) throw new NotFoundException('Class not found');

    if (dto.branchId && dto.branchId !== existing.branchId) {
      await this.ensureBranchExists(dto.branchId);
    }

    const targetBranchId = dto.branchId ?? existing.branchId;

    if (dto.classroomId !== undefined) {
      if (dto.classroomId) {
        await this.ensureClassroomInBranch(dto.classroomId, targetBranchId);
      }
    }

    const data: Prisma.ClassUpdateInput = {
      ...(dto.branchId ? { branch: { connect: { id: dto.branchId } } } : {}),
      ...(dto.classroomId !== undefined
        ? dto.classroomId
          ? { classroom: { connect: { id: dto.classroomId } } }
          : { classroom: { disconnect: true } }
        : {}),
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.code !== undefined ? { code: dto.code } : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      ...(dto.yearGroup !== undefined ? { yearGroup: dto.yearGroup } : {}),
      ...(dto.startDate !== undefined
        ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
        : {}),
      ...(dto.endDate !== undefined
        ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
        : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
      ...(dto.metadata !== undefined ? { metadata: dto.metadata as Prisma.InputJsonValue } : {}),
    };

    const updated = await this.prisma.class.update({ where: { id }, data });
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.class.findFirst({ where: { id, isDeleted: false } });
    if (!existing) throw new NotFoundException('Class not found');

    return this.prisma.class.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), active: false },
    });
  }

  private parseOrder(order?: string): Prisma.ClassOrderByWithRelationInput | Prisma.ClassOrderByWithRelationInput[] | undefined {
    if (!order) return { createdAt: 'desc' } as any;
    // support comma-separated multi order e.g. "name:asc,createdAt:desc"
    const parts = order.split(',').map((s) => s.trim()).filter(Boolean);
    const parsed = parts.map((p) => {
      const [field, dir] = p.split(':');
      const direction = dir?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      const allowed: Record<string, 'asc' | 'desc'> = {
        name: direction,
        createdAt: direction,
        updatedAt: direction,
        capacity: direction,
      };
      if (!(field in allowed)) return undefined;
      return { [field]: direction } as Prisma.ClassOrderByWithRelationInput;
    }).filter(Boolean) as Prisma.ClassOrderByWithRelationInput[];
    return parsed.length > 0 ? parsed : ({ createdAt: 'desc' } as any);
  }

  private async ensureBranchExists(branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new BadRequestException('Branch does not exist');
  }

  private async ensureClassroomInBranch(classroomId: string, branchId: string) {
    const classroom = await this.prisma.classroom.findFirst({ where: { id: classroomId, branchId } });
    if (!classroom) throw new BadRequestException('Classroom not found in branch');
  }
}
