import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from '../orgs/dto/create-branch.dto.js';
import { UpdateBranchDto } from '../orgs/dto/update-branch.dto.js';
import { CreateClassroomDto } from '../orgs/dto/create-classroom.dto.js';
import { UpdateClassroomDto } from '../orgs/dto/update-classroom.dto.js';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  list() {
    return this.branchesService.listBranches();
  }

  @Get(':branchId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  getBranch(@Param('branchId') branchId: string) {
    return this.branchesService.getBranch(branchId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.createBranch(dto);
  }

  @Patch(':branchId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  update(
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.updateBranch(branchId, dto);
  }

  @Delete(':branchId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  remove(@Param('branchId') branchId: string) {
    return this.branchesService.removeBranch(branchId);
  }

  @Get(':branchId/rooms')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  listRooms(@Param('branchId') branchId: string) {
    return this.branchesService.listClassrooms(branchId);
  }

  @Get(':branchId/teacher-profiles')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  listTeacherProfiles(@Param('branchId') branchId: string) {
    return this.branchesService.listTeacherProfiles(branchId);
  }

  @Post(':branchId/rooms')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  createRoom(
    @Param('branchId') branchId: string,
    @Body() dto: CreateClassroomDto,
  ) {
    return this.branchesService.createClassroom(branchId, dto);
  }

  @Patch(':branchId/rooms/:roomId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  updateRoom(
    @Param('branchId') branchId: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateClassroomDto,
  ) {
    return this.branchesService.updateClassroom(branchId, roomId, dto);
  }

  @Delete(':branchId/rooms/:roomId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  removeRoom(
    @Param('branchId') branchId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.branchesService.removeClassroom(branchId, roomId);
  }
}
