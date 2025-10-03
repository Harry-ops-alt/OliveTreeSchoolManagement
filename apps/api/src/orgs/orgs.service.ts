import { Injectable, NotFoundException } from '@nestjs/common';
import { Branch, Classroom, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { CreateClassroomDto } from './dto/create-classroom.dto.js';
import { UpdateClassroomDto } from './dto/update-classroom.dto.js';

export type OrganizationWithBranches = Prisma.OrganizationGetPayload<{
  include: { branches: true };
}>;

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateOrganizationDto,
  ): Promise<OrganizationWithBranches> {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        branches: dto.branches
          ? {
              create: dto.branches.map((branch) => this.mapBranchCreateData(branch)),
            }
          : undefined,
      },
      include: { branches: true },
    });
  }

  async findAll(): Promise<OrganizationWithBranches[]> {
    return this.prisma.organization.findMany({ include: { branches: true } });
  }

  async findOne(id: string): Promise<OrganizationWithBranches> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: { branches: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return organization;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationWithBranches> {
    await this.ensureOrganizationExists(id);

    const data: Prisma.OrganizationUpdateInput = {};

    if (typeof dto.name !== 'undefined') {
      data.name = dto.name;
    }

    if (dto.branches?.length) {
      data.branches = {
        create: dto.branches.map((branch) => this.mapBranchCreateData(branch)),
      };
    }

    const organization = await this.prisma.organization.update({
      where: { id },
      data,
      include: { branches: true },
    });

    return organization;
  }

  async remove(id: string): Promise<OrganizationWithBranches> {
    await this.ensureOrganizationExists(id);

    return this.prisma.organization.delete({
      where: { id },
      include: { branches: true },
    });
  }

  async listBranches(id: string): Promise<Branch[]> {
    await this.ensureOrganizationExists(id);

    return this.prisma.branch.findMany({
      where: { organizationId: id },
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(orgId: string, dto: CreateBranchDto): Promise<Branch> {
    await this.ensureOrganizationExists(orgId);

    return this.prisma.branch.create({
      data: {
        organizationId: orgId,
        ...this.mapBranchCreateData(dto),
      },
    });
  }

  async updateBranch(
    orgId: string,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<Branch> {
    const branch = await this.ensureBranchInOrg(orgId, branchId);

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

    if (Object.keys(data).length === 0) {
      return branch;
    }

    return this.prisma.branch.update({
      where: { id: branchId },
      data,
    });
  }

  async removeBranch(orgId: string, branchId: string): Promise<Branch> {
    await this.ensureBranchInOrg(orgId, branchId);

    return this.prisma.branch.delete({ where: { id: branchId } });
  }

  async listClassrooms(orgId: string, branchId: string): Promise<Classroom[]> {
    await this.ensureBranchInOrg(orgId, branchId);

    return this.prisma.classroom.findMany({
      where: { branchId },
      orderBy: { name: 'asc' },
    });
  }

  async createClassroom(
    orgId: string,
    branchId: string,
    dto: CreateClassroomDto,
  ): Promise<Classroom> {
    await this.ensureBranchInOrg(orgId, branchId);

    return this.prisma.classroom.create({
      data: {
        branchId,
        ...this.mapClassroomCreateData(dto),
      },
    });
  }

  async updateClassroom(
    orgId: string,
    branchId: string,
    classroomId: string,
    dto: UpdateClassroomDto,
  ): Promise<Classroom> {
    await this.ensureBranchInOrg(orgId, branchId);
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
    if (typeof dto.location !== 'undefined') {
      data.location = dto.location ?? null;
    }
    if (typeof dto.notes !== 'undefined') {
      data.notes = dto.notes ?? null;
    }

    if (Object.keys(data).length === 0) {
      return classroom;
    }

    return this.prisma.classroom.update({
      where: { id: classroomId },
      data,
    });
  }

  async removeClassroom(orgId: string, branchId: string, classroomId: string): Promise<Classroom> {
    await this.ensureBranchInOrg(orgId, branchId);
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

  private async ensureOrganizationExists(id: string): Promise<void> {
    const exists = await this.prisma.organization.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Organization ${id} not found`);
    }
  }

  private async ensureBranchInOrg(orgId: string, branchId: string): Promise<Branch> {
    await this.ensureOrganizationExists(orgId);
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        organizationId: orgId,
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found in organization ${orgId}`);
    }

    return branch;
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

  private mapClassroomCreateData(dto: CreateClassroomDto): Prisma.ClassroomCreateWithoutBranchInput {
    return {
      name: dto.name,
      capacity: dto.capacity ?? null,
      location: dto.location ?? null,
      notes: dto.notes ?? null,
    };
  }
}
