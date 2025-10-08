import { Injectable, NotFoundException } from '@nestjs/common';
import { Branch, Classroom, Organization, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto } from '../orgs/dto/create-branch.dto.js';
import { UpdateBranchDto } from '../orgs/dto/update-branch.dto.js';
import { CreateClassroomDto } from '../orgs/dto/create-classroom.dto.js';
import { UpdateClassroomDto } from '../orgs/dto/update-classroom.dto.js';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async listBranches(): Promise<Branch[]> {
    return this.prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getBranch(branchId: string): Promise<Branch> {
    return this.ensureBranch(branchId);
  }

  async createBranch(dto: CreateBranchDto): Promise<Branch> {
    const organization = await this.getDefaultOrganization();

    return this.prisma.branch.create({
      data: {
        organizationId: organization.id,
        ...this.mapBranchCreateData(dto),
      },
    });
  }

  async updateBranch(branchId: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.ensureBranch(branchId);

    const data: Prisma.BranchUpdateInput = this.mapBranchUpdateData(dto);

    if (Object.keys(data).length === 0) {
      return branch;
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data,
    });
  }

  async removeBranch(branchId: string): Promise<Branch> {
    await this.ensureBranch(branchId);

    return this.prisma.branch.delete({ where: { id: branchId } });
  }

  async listClassrooms(branchId: string): Promise<Classroom[]> {
    await this.ensureBranch(branchId);

    return this.prisma.classroom.findMany({
      where: { branchId },
      orderBy: { name: 'asc' },
    });
  }

  async listTeacherProfiles(branchId: string) {
    await this.ensureBranch(branchId);

    const profiles = await this.prisma.teacherProfile.findMany({
      where: { branchId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ user: { firstName: 'asc' } }, { user: { lastName: 'asc' } }],
    });

    return profiles;
  }

  async createClassroom(branchId: string, dto: CreateClassroomDto): Promise<Classroom> {
    await this.ensureBranch(branchId);

    return this.prisma.classroom.create({
      data: {
        branchId,
        ...this.mapClassroomCreateData(dto),
      },
    });
  }

  async updateClassroom(
    branchId: string,
    classroomId: string,
    dto: UpdateClassroomDto,
  ): Promise<Classroom> {
    await this.ensureBranch(branchId);

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: classroomId,
        branchId,
      },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom ${classroomId} not found in branch ${branchId}`);
    }

    const data: Prisma.ClassroomUpdateInput = {};

    if (typeof dto.name !== 'undefined') {
      data.name = dto.name;
    }
    if (typeof dto.capacity !== 'undefined') {
      data.capacity = dto.capacity ?? null;
    }
    if (typeof dto.location !== 'undefined' || typeof dto.notes !== 'undefined') {
      const locationPart = dto.location?.trim();
      const notesPart = dto.notes?.trim();
      const segments = [] as string[];
      if (locationPart) {
        segments.push(`Location: ${locationPart}`);
      }
      if (notesPart) {
        segments.push(notesPart);
      }
      data.description = segments.length ? segments.join('\n\n') : null;
    }

    if (Object.keys(data).length === 0) {
      return classroom;
    }

    return this.prisma.classroom.update({
      where: { id: classroomId },
      data,
    });
  }

  async removeClassroom(branchId: string, classroomId: string): Promise<Classroom> {
    await this.ensureBranch(branchId);

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: classroomId,
        branchId,
      },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom ${classroomId} not found in branch ${branchId}`);
    }

    return this.prisma.classroom.delete({ where: { id: classroomId } });
  }

  private async ensureBranch(branchId: string): Promise<Branch> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found.`);
    }

    return branch;
  }

  private async getDefaultOrganization(): Promise<Organization> {
    const organization = await this.prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!organization) {
      throw new NotFoundException('No organization found. Create an organization before managing branches.');
    }

    return organization;
  }

  private mapBranchCreateData(dto: CreateBranchDto): Prisma.BranchCreateWithoutOrganizationInput {
    return {
      name: dto.name,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      postalCode: dto.postalCode ?? null,
      country: dto.country ?? null,
      timezone: dto.timezone ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      notes: dto.notes ?? null,
    };
  }

  private mapBranchUpdateData(dto: UpdateBranchDto): Prisma.BranchUpdateInput {
    const data: Prisma.BranchUpdateInput = {};

    if (typeof dto.name !== 'undefined') {
      data.name = dto.name;
    }
    if (typeof dto.addressLine1 !== 'undefined') {
      data.addressLine1 = dto.addressLine1 ?? null;
    }
    if (typeof dto.addressLine2 !== 'undefined') {
      data.addressLine2 = dto.addressLine2 ?? null;
    }
    if (typeof dto.city !== 'undefined') {
      data.city = dto.city ?? null;
    }
    if (typeof dto.state !== 'undefined') {
      data.state = dto.state ?? null;
    }
    if (typeof dto.postalCode !== 'undefined') {
      data.postalCode = dto.postalCode ?? null;
    }
    if (typeof dto.country !== 'undefined') {
      data.country = dto.country ?? null;
    }
    if (typeof dto.timezone !== 'undefined') {
      data.timezone = dto.timezone ?? null;
    }
    if (typeof dto.phone !== 'undefined') {
      data.phone = dto.phone ?? null;
    }
    if (typeof dto.email !== 'undefined') {
      data.email = dto.email ?? null;
    }
    if (typeof dto.notes !== 'undefined') {
      data.notes = dto.notes ?? null;
    }

    return data;
  }

  private mapClassroomCreateData(dto: CreateClassroomDto): Prisma.ClassroomCreateWithoutBranchInput {
    const locationPart = dto.location?.trim();
    const notesPart = dto.notes?.trim();
    const segments = [] as string[];
    if (locationPart) {
      segments.push(`Location: ${locationPart}`);
    }
    if (notesPart) {
      segments.push(notesPart);
    }

    return {
      name: dto.name,
      capacity: dto.capacity ?? null,
      description: segments.length ? segments.join('\n\n') : null,
    };
  }
}
