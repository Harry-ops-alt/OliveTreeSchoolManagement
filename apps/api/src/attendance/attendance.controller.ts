import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Capabilities } from '../auth/decorators/capabilities.decorator.js';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto.js';
import { SubmitAttendanceRecordsDto } from './dto/submit-attendance-records.dto.js';
import { ListAttendanceSessionsDto } from './dto/list-attendance-sessions.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SessionUserData } from '../users/users.service.js';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('sessions')
  @Capabilities('operations:attendance')
  createSession(
    @CurrentUser() user: SessionUserData,
    @Body() dto: CreateAttendanceSessionDto,
  ) {
    return this.attendanceService.createSession(user, dto);
  }

  @Get('sessions')
  @Capabilities('operations:attendance')
  listSessions(
    @CurrentUser() user: SessionUserData,
    @Query() query: ListAttendanceSessionsDto,
  ) {
    return this.attendanceService.listSessions(user, query);
  }

  @Get('sessions/:id')
  @Capabilities('operations:attendance')
  getSession(
    @CurrentUser() user: SessionUserData,
    @Param('id') sessionId: string,
  ) {
    return this.attendanceService.getSession(user, sessionId);
  }

  @Post('sessions/:id/records')
  @Capabilities('operations:attendance')
  submitRecords(
    @CurrentUser() user: SessionUserData,
    @Param('id') sessionId: string,
    @Body() dto: SubmitAttendanceRecordsDto,
  ) {
    return this.attendanceService.submitRecords(user, sessionId, dto);
  }

  @Get('students/:studentId')
  @Capabilities('operations:attendance')
  listStudentAttendance(
    @CurrentUser() user: SessionUserData,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.attendanceService.listStudentAttendance(user, studentId);
  }
}
