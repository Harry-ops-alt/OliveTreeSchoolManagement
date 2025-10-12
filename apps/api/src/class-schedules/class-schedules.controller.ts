import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { SisCapability } from '../auth/roles.constants';
import { ClassSchedulesService } from './class-schedules.service';
import { CreateClassScheduleDto } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';

@Controller('branches/:branchId/schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassSchedulesController {
  constructor(private readonly classSchedulesService: ClassSchedulesService) {}

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.TEACHER,
    Role.TEACHING_ASSISTANT,
    Role.SUPPORT_STAFF,
  )
  @Capabilities(SisCapability.ViewClassSchedules)
  list(@Param('branchId') branchId: string) {
    return this.classSchedulesService.listByBranch(branchId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  create(@Param('branchId') branchId: string, @Body() dto: CreateClassScheduleDto) {
    return this.classSchedulesService.create(branchId, dto);
  }

  @Patch(':scheduleId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  update(
    @Param('branchId') branchId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateClassScheduleDto,
  ) {
    return this.classSchedulesService.update(branchId, scheduleId, dto);
  }

  @Delete(':scheduleId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  remove(
    @Param('branchId') branchId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.classSchedulesService.remove(branchId, scheduleId);
  }
}
