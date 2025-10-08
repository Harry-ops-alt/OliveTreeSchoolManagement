import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';

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

  private async ensureOrganizationExists(id: string): Promise<void> {
    const exists = await this.prisma.organization.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Organization ${id} not found`);
    }
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

}
