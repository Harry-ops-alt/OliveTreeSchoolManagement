import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AdmissionApplicationStatus,
  AdmissionContactChannel,
  AdmissionDecision,
  AdmissionLeadStage,
  AdmissionTaskStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { SessionUserData } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateLeadDto } from './dto/create-lead.dto.js';
import type { UpdateLeadDto } from './dto/update-lead.dto.js';
import type { RecordLeadContactDto } from './dto/record-lead-contact.dto.js';
import type { UpdateLeadStageDto } from './dto/update-lead-stage.dto.js';
import type { CreateLeadViewDto } from './dto/create-lead-view.dto.js';
import type { UpdateLeadViewDto } from './dto/update-lead-view.dto.js';
import type { ListLeadsDto } from './dto/list-leads.dto.js';
import type { CreateTasterSessionDto } from './dto/create-taster-session.dto.js';
import type { UpdateTasterSessionDto } from './dto/update-taster-session.dto.js';
import type { AddTasterAttendeeDto } from './dto/add-taster-attendee.dto.js';
import type { UpdateTasterAttendeeDto } from './dto/update-taster-attendee.dto.js';
import type { CreateApplicationDto } from './dto/create-application.dto.js';
import type { UpdateApplicationDto } from './dto/update-application.dto.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { UpdateTaskStatusDto } from './dto/update-task-status.dto.js';
import type { BulkUpdateLeadStageDto } from './dto/bulk-update-lead-stage.dto.js';
import type { BulkAssignLeadStaffDto } from './dto/bulk-assign-lead-staff.dto.js';

const leadInclude = {
  branch: { select: { id: true, name: true } },
  assignedStaff: {
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  },
  contacts: {
    orderBy: { occurredAt: 'desc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
  stageHistory: {
    orderBy: { changedAt: 'desc' },
    include: {
      changedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
  tastings: {
    include: {
      taster: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          branchId: true,
          classroomId: true,
        },
      },
    },
  },
  application: {
    include: {
      branch: { select: { id: true, name: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      offer: true,
      tasks: {
        orderBy: { dueAt: 'asc' },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  },
  tasks: {
    orderBy: { dueAt: 'asc' },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
} as const;

const ALLOWED_FILTER_KEYS = new Set<keyof Prisma.JsonObject | string>([
  'branchId',
  'branchIds',
  'stage',
  'stages',
  'assignedStaffId',
  'assignedStaffIds',
  'tags',
  'search',
  'page',
  'pageSize',
]);

const tasterInclude = {
  branch: { select: { id: true, name: true } },
  classroom: { select: { id: true, name: true } },
  assignedStaff: { select: { id: true, firstName: true, lastName: true, email: true } },
  attendees: {
    include: {
      lead: {
        select: {
          id: true,
          parentFirstName: true,
          parentLastName: true,
          parentEmail: true,
          stage: true,
        },
      },
    },
  },
} as const;

const ORG_LEVEL_ROLES = new Set<Role>([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.OPERATIONS_MANAGER]);

@Injectable()
export class AdmissionsService {
  constructor(private readonly prisma: PrismaService) {}
private toNullableJson(
  value: unknown
): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

  private readonly logger = new Logger(AdmissionsService.name);
  private extractBranchIdFromFilters(
    filters: any,
    defaultBranchId: string | null
  ): string | null {
    // If filters contain a branchId, use it; otherwise fall back
    if (filters && typeof filters.branchId === 'string') {
      return filters.branchId;
    }
    return defaultBranchId;
  }

  async listLeads(user: SessionUserData, filters: ListLeadsDto) {
    try {
      const where = this.buildLeadWhere(user, filters);

      const page = filters.page ?? 1;
      const take = filters.pageSize ?? 20;
      const skip = (page - 1) * take;

      const [total, items] = await this.prisma.$transaction([
        this.prisma.admissionLead.count({ where }),
        this.prisma.admissionLead.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          include: leadInclude,
        }),
      ]);

      return {
        total,
        page,
        pageSize: take,
        items,
      };
    } catch (error) {
      const details = error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error('Failed to fetch admissions leads', details);
      throw new InternalServerErrorException(`Admissions leads query failed: ${details}`);
    }
  }

  async listLeadViews(user: SessionUserData, branchId?: string) {
    const orClauses: Prisma.AdmissionLeadWhereInput[] = [
      {
        savedById: user.id,
        ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      },
    ];

    if (user.orgId) {
      const sharedClause: Prisma.AdmissionLeadWhereInput = {
        sharedWithOrg: true,
        savedBy: { organizationId: user.orgId },
      };

      if (this.isOrgLevelUser(user)) {
        if (branchId) {
          sharedClause.OR = [{ branchId }, { branchId: null }];
        }
      } else {
        sharedClause.OR = [
          { branchId: null },
          ...(user.branchId ? [{ branchId: user.branchId }] : []),
          ...(branchId ? [{ branchId }] : []),
        ];
      }

      orClauses.push(sharedClause);
    }

    const where: Prisma.AdmissionLeadWhereInput = {
      savedViewName: { not: null },
      OR: orClauses,
    };

    const views = await this.prisma.admissionLead.findMany({
      where,
      orderBy: [
        { isDefaultView: 'desc' },
        { createdAt: 'desc' },
      ],
      select: this.savedViewSelect,
    });

    return views.map((view) => this.toLeadViewResponse(view));
  }

  async createLeadView(user: SessionUserData, dto: CreateLeadViewDto) {
    if (dto.sharedWithOrg && !this.isOrgLevelUser(user)) {
      throw new ForbiddenException('Only organization-level users can share views');
    }

    const filters = this.sanitiseLeadViewFilters(dto.filters);

    if (!Object.keys(filters).length) {
      throw new BadRequestException('Filters cannot be empty');
    }

    if (dto.isDefault) {
      await this.prisma.admissionLead.updateMany({
        where: { savedById: user.id, isDefaultView: true, savedViewName: { not: null } },
        data: { isDefaultView: false },
      });
    }

    const branchIdForView = this.extractBranchIdFromFilters(filters, user.branchId ?? null);

    const placeholderEmail = `saved-view-${user.id}-${randomUUID()}@placeholder.local`;

    const view = await this.prisma.admissionLead.create({
      data: {
        parentFirstName: '_SAVED_VIEW_',
        parentLastName: dto.name.trim(),
        parentEmail: placeholderEmail,
        tags: [],
        stage: AdmissionLeadStage.NEW,
        savedViewName: dto.name.trim(),
        savedViewFilters: filters,
        isDefaultView: dto.isDefault ?? false,
        sharedWithOrg: dto.sharedWithOrg ?? false,
        savedBy: { connect: { id: user.id } },
        branch: branchIdForView ? { connect: { id: branchIdForView } } : undefined,
      },
      select: this.savedViewSelect,
    });

    return this.toLeadViewResponse(view);
  }

  async updateLeadView(user: SessionUserData, id: string, dto: UpdateLeadViewDto) {
    const view = await this.ensureLeadViewOwnership(user, id);

    if (dto.sharedWithOrg !== undefined && dto.sharedWithOrg && !this.isOrgLevelUser(user)) {
      throw new ForbiddenException('Only organization-level users can share views');
    }

    const data: Prisma.AdmissionLeadUpdateInput = {};

    if (typeof dto.name === 'string') {
      const trimmedName = dto.name.trim();
      data.savedViewName = trimmedName;
      data.parentLastName = trimmedName;
    }

    if (dto.filters) {
      const filters = this.sanitiseLeadViewFilters(dto.filters);
      if (!Object.keys(filters).length) {
        throw new BadRequestException('Filters cannot be empty');
      }
      data.savedViewFilters = filters;

      const branchIdForView = this.extractBranchIdFromFilters(filters, view.branchId ?? user.branchId ?? null);
      data.branch = branchIdForView
        ? { connect: { id: branchIdForView } }
        : { disconnect: true };
    }

    if (dto.isDefault !== undefined) {
      data.isDefaultView = dto.isDefault;
      if (dto.isDefault) {
        await this.prisma.admissionLead.updateMany({
          where: { savedById: user.id, isDefaultView: true, savedViewName: { not: null }, NOT: { id } },
          data: { isDefaultView: false },
        });
      }
    }

    if (dto.sharedWithOrg !== undefined) {
      data.sharedWithOrg = dto.sharedWithOrg;
    }

    const updated = await this.prisma.admissionLead.update({
      where: { id },
      data,
      select: this.savedViewSelect,
    });

    return this.toLeadViewResponse(updated);
  }

  async deleteLeadView(user: SessionUserData, id: string) {
    await this.ensureLeadViewOwnership(user, id);
    await this.prisma.admissionLead.delete({ where: { id } });
    return { id };
  }

  async getLeadById(user: SessionUserData, leadId: string) {
    await this.ensureLeadAccess(user, leadId);

    const lead = await this.prisma.admissionLead.findUnique({
      where: { id: leadId },
      include: leadInclude,
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async createLead(user: SessionUserData, dto: CreateLeadDto) {
    const branchId = dto.branchId ?? user.branchId ?? null;

    if (dto.branchId && !(await this.branchExists(dto.branchId))) {
      throw new BadRequestException('Branch does not exist');
    }

    if (!branchId && !this.isOrgLevelUser(user)) {
      throw new ForbiddenException('Branch is required for this lead');
    }

    const lead = await this.prisma.admissionLead.create({
      data: {
        branchId,
        assignedStaffId: dto.assignedStaffId ?? null,
        parentFirstName: dto.parentFirstName.trim(),
        parentLastName: dto.parentLastName.trim(),
        parentEmail: dto.parentEmail.toLowerCase(),
        parentPhone: dto.parentPhone?.trim() ?? null,
        studentFirstName: dto.studentFirstName?.trim() ?? null,
        studentLastName: dto.studentLastName?.trim() ?? null,
        studentDateOfBirth: dto.studentDateOfBirth ?? null,
        programmeInterest: dto.programmeInterest?.trim() ?? null,
        preferredContactAt: dto.preferredContactAt ?? null,
        source: dto.source?.trim() ?? null,
        notes: dto.notes?.trim() ?? null,
        tags: dto.tags ?? [],
        metadata: this.toNullableJson(dto.metadata),
      },
      include: leadInclude,
    });

    await this.prisma.admissionLeadStageHistory.create({
      data: {
        leadId: lead.id,
        fromStage: null,
        toStage: lead.stage,
        changedById: user.id ?? null,
        reason: 'Lead created',
      },
    });

    return lead;
  }

  async updateLead(user: SessionUserData, leadId: string, dto: UpdateLeadDto) {
    await this.ensureLeadAccess(user, leadId);

    const data: Prisma.AdmissionLeadUpdateInput = {};

    if (typeof dto.branchId !== 'undefined') {
      if (dto.branchId && !(await this.branchExists(dto.branchId))) {
        throw new BadRequestException('Branch does not exist');
      }
      data.branch = dto.branchId ? { connect: { id: dto.branchId } } : { disconnect: true };
    }
    if (typeof dto.assignedStaffId !== 'undefined') {
      data.assignedStaff = dto.assignedStaffId
        ? { connect: { id: dto.assignedStaffId } }
        : { disconnect: true };
    }
    if (typeof dto.parentFirstName !== 'undefined') {
      data.parentFirstName = dto.parentFirstName.trim();
    }
    if (typeof dto.parentLastName !== 'undefined') {
      data.parentLastName = dto.parentLastName.trim();
    }
    if (typeof dto.parentEmail !== 'undefined') {
      data.parentEmail = dto.parentEmail.toLowerCase();
    }
    if (typeof dto.parentPhone !== 'undefined') {
      data.parentPhone = dto.parentPhone?.trim() ?? null;
    }
    if (typeof dto.studentFirstName !== 'undefined') {
      data.studentFirstName = dto.studentFirstName?.trim() ?? null;
    }
    if (typeof dto.studentLastName !== 'undefined') {
      data.studentLastName = dto.studentLastName?.trim() ?? null;
    }
    if (typeof dto.studentDateOfBirth !== 'undefined') {
      data.studentDateOfBirth = dto.studentDateOfBirth ?? null;
    }
    if (typeof dto.programmeInterest !== 'undefined') {
      data.programmeInterest = dto.programmeInterest?.trim() ?? null;
    }
    if (typeof dto.preferredContactAt !== 'undefined') {
      data.preferredContactAt = dto.preferredContactAt ?? null;
    }
    if (typeof dto.source !== 'undefined') {
      data.source = dto.source?.trim() ?? null;
    }
    if (typeof dto.notes !== 'undefined') {
      data.notes = dto.notes?.trim() ?? null;
    }
    if (typeof dto.tags !== 'undefined') {
      data.tags = dto.tags;
    }
    if (typeof dto.metadata !== 'undefined') {
      data.metadata = this.toNullableJson(dto.metadata);
    }

    const updated = await this.prisma.admissionLead.update({
      where: { id: leadId },
      data,
      include: leadInclude,
    });

    return updated;
  }

  async bulkUpdateLeadStage(user: SessionUserData, dto: BulkUpdateLeadStageDto) {
    const leadIds = Array.from(new Set(dto.leadIds));

    if (!leadIds.length) {
      throw new BadRequestException('At least one lead ID is required');
    }

    const contexts = await Promise.all(
      leadIds.map(async (leadId) => ({ leadId, context: await this.ensureLeadAccess(user, leadId) })),
    );

    const invalidTransitions = contexts
      .filter(({ context }) => context.stage !== dto.toStage && !this.isValidStageTransition(context.stage, dto.toStage))
      .map(({ leadId }) => leadId);

    if (invalidTransitions.length) {
      throw new BadRequestException(
        `Invalid stage transition for leads: ${invalidTransitions
          .map((id) => id)
          .join(', ')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const { leadId, context } of contexts) {
        if (context.stage === dto.toStage) {
          continue;
        }

        const stageUpdate: Prisma.AdmissionLeadUpdateInput = {
          stage: dto.toStage,
          updatedAt: new Date(),
        };

        if (typeof dto.assignedStaffId !== 'undefined') {
          stageUpdate.assignedStaff = dto.assignedStaffId
            ? { connect: { id: dto.assignedStaffId } }
            : { disconnect: true };
        }

        await tx.admissionLead.update({
          where: { id: leadId },
          data: stageUpdate,
        });

        await tx.admissionLeadStageHistory.create({
          data: {
            leadId,
            fromStage: context.stage,
            toStage: dto.toStage,
            changedById: user.id ?? null,
            reason: dto.reason?.trim() ?? null,
          },
        });
      }
    });

    const updatedLeads = await this.prisma.admissionLead.findMany({
      where: { id: { in: leadIds } },
      include: leadInclude,
    });

    const lookup = new Map(updatedLeads.map((lead) => [lead.id, lead] as const));

    return {
      updated: leadIds.map((leadId) => {
        const lead = lookup.get(leadId);
        if (!lead) {
          throw new NotFoundException(`Lead ${leadId} not found after update`);
        }
        return lead;
      }),
    };
  }

  async bulkAssignLeadStaff(user: SessionUserData, dto: BulkAssignLeadStaffDto) {
    const leadIds = Array.from(new Set(dto.leadIds));

    if (!leadIds.length) {
      throw new BadRequestException('At least one lead ID is required');
    }

    const contexts = await Promise.all(
      leadIds.map(async (leadId) => ({ leadId, context: await this.ensureLeadAccess(user, leadId) })),
    );

    const targetStaffId = dto.assignedStaffId ?? null;

    await this.prisma.$transaction(async (tx) => {
      for (const { leadId, context } of contexts) {
        if (context.assignedStaffId === targetStaffId) {
          continue;
        }

        const staffUpdate: Prisma.AdmissionLeadUpdateInput = targetStaffId
          ? { assignedStaff: { connect: { id: targetStaffId } } }
          : { assignedStaff: { disconnect: true } };

        await tx.admissionLead.update({
          where: { id: leadId },
          data: staffUpdate,
        });
      }
    });

    const updatedLeads = await this.prisma.admissionLead.findMany({
      where: { id: { in: leadIds } },
      include: leadInclude,
    });

    const lookup = new Map(updatedLeads.map((lead) => [lead.id, lead] as const));

    return {
      updated: leadIds.map((leadId) => {
        const lead = lookup.get(leadId);
        if (!lead) {
          throw new NotFoundException(`Lead ${leadId} not found after update`);
        }
        return lead;
      }),
    };
  }

  async recordLeadContact(user: SessionUserData, leadId: string, dto: RecordLeadContactDto) {
    await this.ensureLeadAccess(user, leadId);

    const summary = dto.summary?.trim();
    if (!summary) {
      throw new BadRequestException('Contact summary is required');
    }

    await this.prisma.admissionLeadContact.create({
      data: {
        leadId,
        userId: user.id,
        channel: dto.channel,
        summary,
        occurredAt: dto.occurredAt ?? new Date(),
        metadata: this.toNullableJson(dto.metadata),
      },
    });

    return this.getLeadById(user, leadId);
  }

  async updateLeadStage(user: SessionUserData, leadId: string, dto: UpdateLeadStageDto) {
    const lead = await this.ensureLeadAccess(user, leadId);
    const targetStage = dto.toStage;

    if (!targetStage) {
      throw new BadRequestException('Target stage is required');
    }

    if (lead.stage === targetStage) {
      return lead;
    }

    if (!this.isValidStageTransition(lead.stage, targetStage)) {
      throw new BadRequestException('Invalid stage transition');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.admissionLead.update({
        where: { id: leadId },
        data: {
          stage: targetStage,
          assignedStaffId: typeof dto.assignedStaffId !== 'undefined' ? dto.assignedStaffId : lead.assignedStaffId,
        },
        include: leadInclude,
      });

      await tx.admissionLeadStageHistory.create({
        data: {
          leadId,
          fromStage: lead.stage,
          toStage: targetStage,
          changedById: user.id ?? null,
          reason: dto.reason?.trim() ?? null,
        },
      });

      return result;
    });

    return updated;
  }

  async listTasters(user: SessionUserData, branchId?: string) {
    const where: Prisma.AdmissionTasterSessionWhereInput = {};
    if (branchId) {
      where.branchId = branchId;
    } else if (user.branchId && !this.isOrgLevelUser(user)) {
      where.branchId = user.branchId;
    }

    return this.prisma.admissionTasterSession.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: tasterInclude,
    });
  }

  async createTaster(user: SessionUserData, dto: CreateTasterSessionDto) {
    const branchId = dto.branchId ?? user.branchId;

    if (!branchId) {
      throw new BadRequestException('Branch is required');
    }

    const taster = await this.prisma.admissionTasterSession.create({
      data: {
        branchId,
        classroomId: dto.classroomId ?? null,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        capacity: dto.capacity ?? null,
        assignedStaffId: dto.assignedStaffId ?? null,
      },
      include: tasterInclude,
    });

    return taster;
  }

  async updateTaster(user: SessionUserData, tasterId: string, dto: UpdateTasterSessionDto) {
    const taster = await this.prisma.admissionTasterSession.findUnique({ where: { id: tasterId } });
    if (!taster) {
      throw new NotFoundException('Taster session not found');
    }
    if (!this.canAccessBranch(user, taster.branchId)) {
      throw new ForbiddenException();
    }

    const data: Prisma.AdmissionTasterSessionUpdateInput = {};

    if (typeof dto.branchId !== 'undefined') {
      if (dto.branchId && !(await this.branchExists(dto.branchId))) {
        throw new BadRequestException('Branch does not exist');
      }
      data.branch = dto.branchId ? { connect: { id: dto.branchId } } : undefined;
    }
    if (typeof dto.classroomId !== 'undefined') {
      data.classroom = dto.classroomId
        ? { connect: { id: dto.classroomId } }
        : { disconnect: true };
    }
    if (typeof dto.title !== 'undefined') {
      data.title = dto.title.trim();
    }
    if (typeof dto.description !== 'undefined') {
      data.description = dto.description?.trim() ?? null;
    }
    if (typeof dto.startTime !== 'undefined') {
      data.startTime = dto.startTime;
    }
    if (typeof dto.endTime !== 'undefined') {
      data.endTime = dto.endTime;
    }
    if (typeof dto.capacity !== 'undefined') {
      data.capacity = dto.capacity ?? null;
    }
    if (typeof dto.assignedStaffId !== 'undefined') {
      data.assignedStaff = dto.assignedStaffId
        ? { connect: { id: dto.assignedStaffId } }
        : { disconnect: true };
    }

    return this.prisma.admissionTasterSession.update({
      where: { id: tasterId },
      data,
      include: tasterInclude,
    });
  }

  async addTasterAttendee(user: SessionUserData, dto: AddTasterAttendeeDto) {
    //
    if (!dto.tasterId) {
    throw new BadRequestException('tasterId is required');
  }
    const tasterId = dto.tasterId;

    const taster = await this.prisma.admissionTasterSession.findUnique({
      where: { id: tasterId },
    });

    if (!taster) {
      throw new NotFoundException('Taster session not found');
    }

    if (!this.canAccessBranch(user, taster.branchId)) {
      throw new ForbiddenException();
    }

    await this.ensureLeadAccess(user, dto.leadId);

    await this.prisma.admissionTasterAttendee.upsert({
      where: {
        tasterId_leadId: {
          tasterId: tasterId,
          leadId: dto.leadId,
        },
      },
      update: {
        status: dto.status ?? undefined,
        notes: dto.notes?.trim() ?? undefined,
      },
      create: {
        leadId: dto.leadId,
        tasterId: tasterId,
        status: dto.status ?? undefined,
        notes: dto.notes?.trim() ?? null,
      },
    });

    return this.prisma.admissionTasterSession.findUnique({
      where: { id: tasterId },
      include: tasterInclude,
    });
  }

  async updateTasterAttendee(user: SessionUserData, tasterId: string, attendeeId: string, dto: UpdateTasterAttendeeDto) {
    const attendee = await this.prisma.admissionTasterAttendee.findUnique({
      where: { id: attendeeId },
    });

    if (!attendee || attendee.tasterId !== tasterId) {
      throw new NotFoundException('Taster attendee not found');
    }

    const taster = await this.prisma.admissionTasterSession.findUnique({ where: { id: attendee.tasterId } });
    if (!taster) {
      throw new NotFoundException('Taster session not found');
    }
    if (!this.canAccessBranch(user, taster.branchId)) {
      throw new ForbiddenException();
    }

    await this.prisma.admissionTasterAttendee.update({
      where: { id: attendeeId },
      data: {
        status: dto.status ?? undefined,
        notes: typeof dto.notes !== 'undefined' ? dto.notes?.trim() ?? null : undefined,
        attendedAt: typeof dto.attendedAt !== 'undefined' ? dto.attendedAt ?? null : undefined,
      },
    });

    return this.prisma.admissionTasterSession.findUnique({
      where: { id: attendee.tasterId },
      include: tasterInclude,
    });
  }

  async createApplication(user: SessionUserData, dto: CreateApplicationDto) {
    await this.ensureLeadAccess(user, dto.leadId);

    const application = await this.prisma.admissionApplication.create({
      data: {
        leadId: dto.leadId,
        branchId: dto.branchId ?? null,
        yearGroup: dto.yearGroup?.trim() ?? null,
        requestedStart: dto.requestedStart ?? null,
        status: dto.status ?? AdmissionApplicationStatus.DRAFT,
        submittedAt: dto.submittedAt ?? null,
        reviewedById: dto.reviewedById ?? null,
        decision: dto.decision ?? null,
        decisionNotes: dto.decisionNotes?.trim() ?? null,
        decisionAt: dto.decisionAt ?? null,
        extraData: this.toNullableJson(dto.extraData),
      },
      include: leadInclude,
    });

    return application;
  }

  async updateApplication(user: SessionUserData, applicationId: string, dto: UpdateApplicationDto) {
    const application = await this.prisma.admissionApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    await this.ensureLeadAccess(user, application.leadId);

    const data: Prisma.AdmissionApplicationUpdateInput = {};

    if (typeof dto.branchId !== 'undefined') {
      data.branch = dto.branchId ? { connect: { id: dto.branchId } } : { disconnect: true };
    }
    if (typeof dto.yearGroup !== 'undefined') {
      data.yearGroup = dto.yearGroup?.trim() ?? null;
    }
    if (typeof dto.requestedStart !== 'undefined') {
      data.requestedStart = dto.requestedStart ?? null;
    }
    if (typeof dto.status !== 'undefined') {
      data.status = dto.status;
    }
    if (typeof dto.submittedAt !== 'undefined') {
      data.submittedAt = dto.submittedAt ?? null;
    }
    if (typeof dto.reviewedById !== 'undefined') {
      data.reviewedBy = dto.reviewedById
        ? { connect: { id: dto.reviewedById } }
        : { disconnect: true };
    }
    if (typeof dto.decision !== 'undefined') {
      data.decision = dto.decision ?? null;
    }
    if (typeof dto.decisionNotes !== 'undefined') {
      data.decisionNotes = dto.decisionNotes?.trim() ?? null;
    }
    if (typeof dto.decisionAt !== 'undefined') {
      data.decisionAt = dto.decisionAt ?? null;
    }
    if (typeof dto.extraData !== 'undefined') {
      data.extraData = this.toNullableJson(dto.extraData);
    }

    const updated = await this.prisma.admissionApplication.update({
      where: { id: applicationId },
      data,
      include: leadInclude,
    });

    return updated;
  }

  async createTask(user: SessionUserData, dto: CreateTaskDto) {
    if (!dto.leadId && !dto.applicationId) {
      throw new BadRequestException('Task must be associated with a lead or application');
    }

    if (dto.leadId) {
      await this.ensureLeadAccess(user, dto.leadId);
    }
    if (dto.applicationId) {
      const application = await this.prisma.admissionApplication.findUnique({ where: { id: dto.applicationId } });
      if (!application) {
        throw new NotFoundException('Application not found');
      }
      await this.ensureLeadAccess(user, application.leadId);
    }

    const task = await this.prisma.admissionTask.create({
      data: {
        leadId: dto.leadId ?? null,
        applicationId: dto.applicationId ?? null,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        dueAt: dto.dueAt ?? null,
        assigneeId: dto.assigneeId ?? null,
        createdById: user.id ?? null,
        status: dto.status ?? AdmissionTaskStatus.PENDING,
        metadata: this.toNullableJson(dto.metadata),
      },
    });

    return this.getLeadById(user, task.leadId ?? (await this.findLeadIdForApplication(task.applicationId!))!);
  }

  async updateTaskStatus(user: SessionUserData, taskId: string, dto: UpdateTaskStatusDto) {
    const task = await this.prisma.admissionTask.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const leadId = task.leadId ?? (await this.findLeadIdForApplication(task.applicationId!));
    if (!leadId) {
      throw new BadRequestException('Task is not linked to a lead');
    }

    await this.ensureLeadAccess(user, leadId);

    await this.prisma.admissionTask.update({
      where: { id: taskId },
      data: {
        status: dto.status,
        completedAt: dto.status === AdmissionTaskStatus.COMPLETED ? new Date() : null,
      },
    });

    return this.getLeadById(user, leadId);
  }

  private buildLeadWhere(user: SessionUserData, filters: ListLeadsDto): Prisma.AdmissionLeadWhereInput {
    const where: Prisma.AdmissionLeadWhereInput = {};

    const branchFilters = Array.from(
      new Set([
        ...(filters.branchIds ?? []),
        ...(filters.branchId ? [filters.branchId] : []),
      ]),
    ).filter((id) => id !== undefined);

    if (branchFilters.length) {
      where.branchId = branchFilters.length === 1 ? branchFilters[0] : { in: branchFilters as string[] };
    } else if (!this.isOrgLevelUser(user) && user.branchId) {
      where.branchId = user.branchId;
    }

    const stageFilters = Array.from(
      new Set([
        ...(filters.stages ?? []),
        ...(filters.stage ? [filters.stage] : []),
      ]),
    );

    if (stageFilters.length) {
      where.stage = stageFilters.length === 1 ? stageFilters[0] : { in: stageFilters };
    }

    const assignedStaffFilters = Array.from(
      new Set([
        ...(filters.assignedStaffIds ?? []),
        ...(filters.assignedStaffId ? [filters.assignedStaffId] : []),
      ]),
    );

    if (assignedStaffFilters.length) {
      where.assignedStaffId =
        assignedStaffFilters.length === 1
          ? assignedStaffFilters[0]
          : { in: assignedStaffFilters };
    }

    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }

    const searchTerms = filters.search?.split(/\s+/).filter((term) => term.length > 0) ?? [];
    if (searchTerms.length) {
      const searchConditions: Prisma.AdmissionLeadWhereInput[] = searchTerms.map((term) => ({
        OR: [
          { parentFirstName: { contains: term, mode: 'insensitive' } },
          { parentLastName: { contains: term, mode: 'insensitive' } },
          { parentEmail: { contains: term, mode: 'insensitive' } },
          { parentPhone: { contains: term, mode: 'insensitive' } },
          { studentFirstName: { contains: term, mode: 'insensitive' } },
          { studentLastName: { contains: term, mode: 'insensitive' } },
          { programmeInterest: { contains: term, mode: 'insensitive' } },
          { notes: { contains: term, mode: 'insensitive' } },
          { tags: { has: term } },
        ],
      }));

      const existingAnd = where.AND;
      const andConditions: Prisma.AdmissionLeadWhereInput[] = Array.isArray(existingAnd)
        ? [...existingAnd]
        : existingAnd
        ? [existingAnd]
        : [];

      andConditions.push(...searchConditions);
      where.AND = andConditions;
    }

    return where;
  }

  private async ensureLeadAccess(user: SessionUserData, leadId: string) {
    const lead = await this.prisma.admissionLead.findUnique({
      where: { id: leadId },
      select: { branchId: true, assignedStaffId: true, stage: true },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (!this.canAccessBranch(user, lead.branchId)) {
      throw new ForbiddenException();
    }

    return lead;
  }

  private isValidStageTransition(from: AdmissionLeadStage, to: AdmissionLeadStage): boolean {
    if (from === to) {
      return false;
    }

    return true;
  }

  private async branchExists(branchId: string): Promise<boolean> {
    if (!branchId) {
      return false;
    }

    const count = await this.prisma.branch.count({ where: { id: branchId } });
    return count > 0;
  }

  private canAccessBranch(user: SessionUserData, branchId: string | null): boolean {
    if (!branchId) {
      return this.isOrgLevelUser(user);
    }

    if (this.isOrgLevelUser(user)) {
      return true;
    }

    if (user.branchId === branchId) {
      return true;
    }

    return false;
  }

  private isOrgLevelUser(user: SessionUserData): boolean {
    return ORG_LEVEL_ROLES.has(user.role);
  }

  private sanitiseLeadViewFilters(filters: Record<string, unknown>): Prisma.JsonObject {
    const payload: Prisma.JsonObject = {};

    for (const [key, value] of Object.entries(filters)) {
      if (!ALLOWED_FILTER_KEYS.has(key) || value === undefined || value === null) {
        continue;
      }
      payload[key] = value as Prisma.JsonValue;
    }
    return payload;
  }

  private readonly savedViewSelect = {
    id: true,
    savedViewName: true,
    savedViewFilters: true,
    isDefaultView: true,
    sharedWithOrg: true,
    createdAt: true,
    updatedAt: true,
    branchId: true,
    savedById: true,
  } as const;

  private toLeadViewResponse(view: {
    id: string;
    savedViewName: string | null;
    savedViewFilters: Prisma.JsonValue | null;
    isDefaultView: boolean | null;
    sharedWithOrg: boolean | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: view.id,
      name: view.savedViewName ?? '',
      filters: (view.savedViewFilters as Prisma.JsonObject) ?? {},
      isDefault: view.isDefaultView ?? false,
      sharedWithOrg: view.sharedWithOrg ?? false,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
    };
  }

  private async ensureLeadViewOwnership(user: SessionUserData, id: string) {
    const view = await this.prisma.admissionLead.findUnique({
      where: { id },
      select: this.savedViewSelect,
    });

    if (!view) {
      throw new NotFoundException('Lead view not found');
    }

    if (view.savedById !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this view');
    }

    return view;
  }

  private async findLeadIdForApplication(applicationId: string): Promise<string | null> {
    if (!applicationId) {
      return null;
    }

    const application = await this.prisma.admissionApplication.findUnique({
      where: { id: applicationId },
      select: { leadId: true },
    });

    return application?.leadId ?? null;
  }
}
