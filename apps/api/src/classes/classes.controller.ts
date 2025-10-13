import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { SisCapability } from '../auth/roles.constants';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ListClassesDto } from './dto/list-classes.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

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
  list(@Query() query: ListClassesDto) {
    return this.classesService.list(query);
  }

  @Get(':id')
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
  get(@Param('id') id: string) {
    return this.classesService.getById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER, Role.BRANCH_MANAGER)
  @Capabilities(SisCapability.ManageClassSchedules)
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
