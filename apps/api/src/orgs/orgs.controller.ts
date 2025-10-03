import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { OrgsService, OrganizationWithBranches } from './orgs.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

@Controller('orgs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  create(
    @Body() createOrganizationDto: CreateOrganizationDto,
  ): Promise<OrganizationWithBranches> {
    return this.orgsService.create(createOrganizationDto);
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
  )
  findAll(): Promise<OrganizationWithBranches[]> {
    return this.orgsService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
  )
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganizationWithBranches> {
    return this.orgsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationWithBranches> {
    return this.orgsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganizationWithBranches> {
    return this.orgsService.remove(id);
  }

  @Get(':id/branches')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
  )
  listBranches(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgsService.listBranches(id);
  }

  @Post(':id/branches')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  createBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.orgsService.createBranch(id, dto);
  }

  @Patch(':id/branches/:branchId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  updateBranch(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.orgsService.updateBranch(orgId, branchId, dto);
  }

  @Delete(':id/branches/:branchId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  removeBranch(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.orgsService.removeBranch(orgId, branchId);
  }
}
