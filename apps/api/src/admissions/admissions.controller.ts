import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdmissionsService } from './admissions.service';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { AdmissionsCapability } from '../auth/roles.constants';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SessionUserData } from '../users/users.service';
import type { ListLeadsDto } from './dto/list-leads.dto';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { UpdateLeadDto } from './dto/update-lead.dto';
import type { RecordLeadContactDto } from './dto/record-lead-contact.dto';
import type { UpdateLeadStageDto } from './dto/update-lead-stage.dto';
import type { CreateTasterSessionDto } from './dto/create-taster-session.dto';
import type { UpdateTasterSessionDto } from './dto/update-taster-session.dto';
import type { AddTasterAttendeeDto } from './dto/add-taster-attendee.dto';
import type { UpdateTasterAttendeeDto } from './dto/update-taster-attendee.dto';
import type { CreateApplicationDto } from './dto/create-application.dto';
import type { UpdateApplicationDto } from './dto/update-application.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import type { BulkUpdateLeadStageDto } from './dto/bulk-update-lead-stage.dto';
import type { BulkAssignLeadStaffDto } from './dto/bulk-assign-lead-staff.dto';
import type { CreateLeadViewDto } from './dto/create-lead-view.dto';
import type { UpdateLeadViewDto } from './dto/update-lead-view.dto';
import type { ListLeadViewsDto } from './dto/list-lead-views.dto';

@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  private readonly logger = new Logger(AdmissionsController.name);

  @Get('leads/views')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.ADMISSIONS_OFFICER,
  )
  @Capabilities(AdmissionsCapability.ViewLeads)
  listLeadViews(@CurrentUser() user: SessionUserData, @Query() query: ListLeadViewsDto) {
    const { branchId } = query;
    return this.admissionsService.listLeadViews(user, branchId);
  }

  @Post('leads/views')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  createLeadView(@CurrentUser() user: SessionUserData, @Body() dto: CreateLeadViewDto) {
    return this.admissionsService.createLeadView(user, dto);
  }

  @Patch('leads/views/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  updateLeadView(
    @CurrentUser() user: SessionUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadViewDto,
  ) {
    return this.admissionsService.updateLeadView(user, id, dto);
  }

  @Delete('leads/views/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  deleteLeadView(@CurrentUser() user: SessionUserData, @Param('id', ParseUUIDPipe) id: string) {
    return this.admissionsService.deleteLeadView(user, id);
  }

  @Get('leads')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.ADMISSIONS_OFFICER,
  )
  @Capabilities(AdmissionsCapability.ViewLeads)
  async listLeads(@CurrentUser() user: SessionUserData, @Query() filters: ListLeadsDto) {
    try {
      return await this.admissionsService.listLeads(user, filters);
    } catch (error) {
      const details = error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error('Failed to list admissions leads', details);
      throw error;
    }
  }

  @Get('leads/:id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.ADMISSIONS_OFFICER,
  )
  @Capabilities(AdmissionsCapability.ViewLeads)
  getLead(
    @CurrentUser() user: SessionUserData,
    @Param('id') id: string,
  ) {
    return this.admissionsService.getLeadById(user, id);
  }

  @Post('leads')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  createLead(@CurrentUser() user: SessionUserData, @Body() dto: CreateLeadDto) {
    return this.admissionsService.createLead(user, dto);
  }

  @Patch('leads/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  updateLead(
    @CurrentUser() user: SessionUserData,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.admissionsService.updateLead(user, id, dto);
  }

  @Post('leads/:id/contacts')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  recordLeadContact(
    @CurrentUser() user: SessionUserData,
    @Param('id') id: string,
    @Body() dto: RecordLeadContactDto,
  ) {
    return this.admissionsService.recordLeadContact(user, id, dto);
  }

  @Post('leads/:id/stage')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  updateLeadStage(
    @CurrentUser() user: SessionUserData,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStageDto,
  ) {
    return this.admissionsService.updateLeadStage(user, id, dto);
  }

  @Post('leads/bulk-stage')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  bulkUpdateLeadStage(
    @CurrentUser() user: SessionUserData,
    @Body() dto: BulkUpdateLeadStageDto,
  ) {
    return this.admissionsService.bulkUpdateLeadStage(user, dto);
  }

  @Post('leads/bulk-assign')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageLeads)
  bulkAssignLeadStaff(
    @CurrentUser() user: SessionUserData,
    @Body() dto: BulkAssignLeadStaffDto,
  ) {
    return this.admissionsService.bulkAssignLeadStaff(user, dto);
  }

  @Get('tasters')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.ADMISSIONS_OFFICER,
  )
  @Capabilities(AdmissionsCapability.ManageTasters)
  listTasters(
    @CurrentUser() user: SessionUserData,
    @Query('branchId') branchId?: string,
  ) {
    return this.admissionsService.listTasters(user, branchId);
  }

  @Post('tasters')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageTasters)
  createTaster(@CurrentUser() user: SessionUserData, @Body() dto: CreateTasterSessionDto) {
    return this.admissionsService.createTaster(user, dto);
  }

  @Patch('tasters/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageTasters)
  updateTaster(
    @CurrentUser() user: SessionUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTasterSessionDto,
  ) {
    return this.admissionsService.updateTaster(user, id, dto);
  }

  @Post('tasters/:id/attendees')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageTasters)
  addTasterAttendee(
    @CurrentUser() user: SessionUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTasterAttendeeDto,
  ) {
    return this.admissionsService.addTasterAttendee(user, {
      ...dto,
      tasterId: id,
    });
  }

  @Patch('tasters/:tasterId/attendees/:attendeeId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageTasters)
  updateTasterAttendee(
    @CurrentUser() user: SessionUserData,
    @Param('tasterId', ParseUUIDPipe) tasterId: string,
    @Param('attendeeId', ParseUUIDPipe) attendeeId: string,
    @Body() dto: UpdateTasterAttendeeDto,
  ) {
    return this.admissionsService.updateTasterAttendee(user, tasterId, attendeeId, dto);
  }

  @Post('applications')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageApplications)
  createApplication(@CurrentUser() user: SessionUserData, @Body() dto: CreateApplicationDto) {
    return this.admissionsService.createApplication(user, dto);
  }

  @Patch('applications/:id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageApplications)
  updateApplication(
    @CurrentUser() user: SessionUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.admissionsService.updateApplication(user, id, dto);
  }

  @Post('tasks')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageApplications)
  createTask(@CurrentUser() user: SessionUserData, @Body() dto: CreateTaskDto) {
    return this.admissionsService.createTask(user, dto);
  }

  @Patch('tasks/:id/status')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.BRANCH_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities(AdmissionsCapability.ManageApplications)
  updateTaskStatus(
    @CurrentUser() user: SessionUserData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.admissionsService.updateTaskStatus(user, id, dto);
  }
}
