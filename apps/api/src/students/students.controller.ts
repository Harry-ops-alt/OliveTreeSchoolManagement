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
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { SisCapability } from '../auth/roles.constants';
import { StudentsService } from './students.service';
import { ListStudentsDto } from './dto/list-students.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SessionUserData } from '../users/users.service';

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
  @Capabilities(SisCapability.ViewStudents)
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
  @Capabilities(SisCapability.ViewStudents)
  getById(@CurrentUser() user: SessionUserData, @Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.getById(user, id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(SisCapability.ManageStudents)
  create(@CurrentUser() user: SessionUserData, @Body() payload: CreateStudentDto) {
    return this.studentsService.create(user, payload);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(SisCapability.ManageStudents)
  update(
    @CurrentUser() user: SessionUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payload: UpdateStudentDto,
  ) {
    return this.studentsService.update(user, id, payload);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(SisCapability.ManageStudents)
  archive(@CurrentUser() user: SessionUserData, @Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.archive(user, id);
  }
}
