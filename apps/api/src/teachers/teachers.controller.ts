import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { SisCapability } from '../auth/roles.constants';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ListTeachersDto } from './dto/list-teachers.dto';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
  )
  @Capabilities(SisCapability.ViewClassSchedules)
  list(@Query() query: ListTeachersDto) {
    return this.teachersService.list(query);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
  )
  @Capabilities(SisCapability.ViewClassSchedules)
  get(@Param('id') id: string) {
    return this.teachersService.getById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  create(@Body() dto: CreateTeacherDto) {
    return this.teachersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
