import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { StudentsService } from './students.service.js';
import { ListStudentsDto } from './dto/list-students.dto.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SessionUserData } from '../users/users.service.js';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.ADMISSIONS_OFFICER,
  )
  list(@CurrentUser() user: SessionUserData, @Query() filters: ListStudentsDto) {
    return this.studentsService.list(user, filters);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.ADMISSIONS_OFFICER,
    Role.TEACHER,
  )
  getById(@CurrentUser() user: SessionUserData, @Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getById(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  create(@CurrentUser() user: SessionUserData, @Body() payload: CreateStudentDto) {
    return this.studentsService.create(user, payload);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  update(
    @CurrentUser() user: SessionUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateStudentDto,
  ) {
    return this.studentsService.update(user, id, payload);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  archive(@CurrentUser() user: SessionUserData, @Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.archive(user, id);
  }
}
