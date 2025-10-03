import { Injectable, NotFoundException } from '@nestjs/common';
import { Branch, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

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
              create: dto.branches.map((branch) => ({
                name: branch.name,
              })),
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
        create: dto.branches.map((branch) => ({
          name: branch.name,
        })),
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
        name: dto.name,
      },
    });
  }

  async updateBranch(
    orgId: string,
    branchId: string,
    dto: UpdateBranchDto,
  ): Promise<Branch> {
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

    return this.prisma.branch.update({
      where: { id: branchId },
      data: {
        name: dto.name ?? branch.name,
      },
    });
  }

  async removeBranch(orgId: string, branchId: string): Promise<Branch> {
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

    return this.prisma.branch.delete({ where: { id: branchId } });
  }

  private async ensureOrganizationExists(id: string): Promise<void> {
    const exists = await this.prisma.organization.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Organization ${id} not found`);
    }
  }
}
