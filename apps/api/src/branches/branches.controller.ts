import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { SisCapability } from '../auth/roles.constants';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from '../orgs/dto/create-branch.dto';
import { UpdateBranchDto } from '../orgs/dto/update-branch.dto';
import { CreateClassroomDto } from '../orgs/dto/create-classroom.dto';
import { UpdateClassroomDto } from '../orgs/dto/update-classroom.dto';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ViewBranches)
  list() {
    return this.branchesService.listBranches();
  }

  @Get(':branchId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ViewBranches)
  getBranch(@Param('branchId') branchId: string) {
    return this.branchesService.getBranch(branchId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @Capabilities(SisCapability.ManageBranches)
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.createBranch(dto);
  }

  @Patch(':branchId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageBranches)
  update(
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.updateBranch(branchId, dto);
  }

  @Delete(':branchId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN)
  @Capabilities(SisCapability.ManageBranches)
  remove(@Param('branchId') branchId: string) {
    return this.branchesService.removeBranch(branchId);
  }

  @Get(':branchId/rooms')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ViewClassSchedules)
  listRooms(@Param('branchId') branchId: string) {
    return this.branchesService.listClassrooms(branchId);
  }

  @Get(':branchId/teacher-profiles')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ViewBranches)
  listTeacherProfiles(@Param('branchId') branchId: string) {
    return this.branchesService.listTeacherProfiles(branchId);
  }

  @Post(':branchId/rooms')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  createRoom(
    @Param('branchId') branchId: string,
    @Body() dto: CreateClassroomDto,
  ) {
    return this.branchesService.createClassroom(branchId, dto);
  }

  @Patch(':branchId/rooms/:roomId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  updateRoom(
    @Param('branchId') branchId: string,
    @Param('roomId') roomId: string,
    @Body() dto: UpdateClassroomDto,
  ) {
    return this.branchesService.updateClassroom(branchId, roomId, dto);
  }

  @Delete(':branchId/rooms/:roomId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  removeRoom(
    @Param('branchId') branchId: string,
    @Param('roomId') roomId: string,
  ) {
    return this.branchesService.removeClassroom(branchId, roomId);
  }
}
