import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ClassSchedule,
  StaffAssignment,
  StaffAssignmentRole,
  TeacherProfile,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassScheduleDto, StaffAssignmentInput } from './dto/create-class-schedule.dto';
import { UpdateClassScheduleDto } from './dto/update-class-schedule.dto';
import { ClassScheduleClashDetails } from './interfaces/clash-details.interface';

type ClassScheduleWithRelations = ClassSchedule & {
  classroom: { id: string; name: string } | null;
  teacherProfile: (TeacherProfile & { user?: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null }) | null;
  assignments: StaffAssignment[];
};

@Injectable()
export class ClassSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByBranch(branchId: string): Promise<ClassScheduleWithRelations[]> {
    await this.ensureBranch(branchId);

    const schedules = await this.prisma.classSchedule.findMany({
      where: { branchId },
      include: this.defaultInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return schedules as ClassScheduleWithRelations[];
  }

  async create(branchId: string, dto: CreateClassScheduleDto): Promise<ClassScheduleWithRelations> {
    await this.ensureBranch(branchId);

    const startMinutes = this.resolveMinutes(dto.startTime);
    const endMinutes = this.resolveMinutes(dto.endTime);
    this.ensureValidTimeRange(startMinutes, endMinutes);

    await this.ensureClassroomBelongsToBranch(branchId, dto.classroomId);
    const teacherProfileContext = await this.resolveTeacherProfile(branchId, dto.teacherProfileId ?? null);

    const staffUserIds = this.resolveStaffUserIdsFromInputs(
      dto.primaryInstructor,
      dto.additionalStaff,
      teacherProfileContext?.userId ?? null,
    );

    await this.throwIfClashing({
      branchId,
      dayOfWeek: dto.dayOfWeek,
      startMinutes,
      endMinutes,
      classroomId: dto.classroomId ?? null,
      teacherProfileId: dto.teacherProfileId ?? null,
      staffUserIds,
    });

    const schedule = await this.prisma.classSchedule.create({
      data: this.mapCreateDtoToPrisma(branchId, dto),
      include: this.defaultInclude,
    });

    await this.syncStaffAssignments(schedule.id, dto.primaryInstructor, dto.additionalStaff);

    return this.ensureScheduleInBranch(branchId, schedule.id);
  }

  async update(
    branchId: string,
    scheduleId: string,
    dto: UpdateClassScheduleDto,
  ): Promise<ClassScheduleWithRelations> {
    const existing = await this.ensureScheduleInBranch(branchId, scheduleId);

    const dayOfWeek = dto.dayOfWeek ?? existing.dayOfWeek;
    const startMinutes = this.resolveMinutes(dto.startTime ?? existing.startTime);
    const endMinutes = this.resolveMinutes(dto.endTime ?? existing.endTime);
    this.ensureValidTimeRange(startMinutes, endMinutes);

    const classroomId =
      dto.classroomId === undefined ? existing.classroomId ?? null : dto.classroomId ?? null;
    await this.ensureClassroomBelongsToBranch(branchId, classroomId);

    const teacherProfileId =
      dto.teacherProfileId === undefined ? existing.teacherProfileId ?? null : dto.teacherProfileId ?? null;
    const teacherProfileContext = await this.resolveTeacherProfile(branchId, teacherProfileId, existing.teacherProfile ?? undefined);

    const staffUserIds =
      dto.additionalStaff !== undefined || dto.primaryInstructor !== undefined
        ? this.resolveStaffUserIdsFromInputs(
            dto.primaryInstructor,
            dto.additionalStaff,
            teacherProfileContext?.userId ?? null,
          )
        : this.resolveStaffUserIdsFromExistingAssignments(existing.assignments, teacherProfileContext?.userId ?? null);

    await this.throwIfClashing({
      branchId,
      dayOfWeek,
      startMinutes,
      endMinutes,
      classroomId,
      teacherProfileId,
      staffUserIds,
      excludeScheduleId: scheduleId,
    });

    const data = this.mapUpdateDtoToPrisma(dto);

    const schedule = await this.prisma.classSchedule.update({
      where: { id: scheduleId },
      data,
      include: this.defaultInclude,
    });

    if (typeof dto.additionalStaff !== 'undefined' || typeof dto.primaryInstructor !== 'undefined') {
      await this.syncStaffAssignments(scheduleId, dto.primaryInstructor, dto.additionalStaff);
      return this.ensureScheduleInBranch(branchId, scheduleId);
    }

    return schedule as ClassScheduleWithRelations;
  }

  async remove(branchId: string, scheduleId: string): Promise<ClassScheduleWithRelations> {
    await this.ensureScheduleInBranch(branchId, scheduleId);

    await this.prisma.staffAssignment.deleteMany({
      where: { scheduleId },
    });

    const removed = await this.prisma.classSchedule.delete({
      where: { id: scheduleId },
      include: this.defaultInclude,
    });

    return removed as ClassScheduleWithRelations;
  }

  private get defaultInclude(): Prisma.ClassScheduleInclude {
    return {
      classroom: true,
      teacherProfile: { include: { user: true } },
      assignments: {
        include: { user: true },
      },
    };
  }

  private mapCreateDtoToPrisma(
    branchId: string,
    dto: CreateClassScheduleDto,
  ): Prisma.ClassScheduleCreateInput {
    return {
      branch: { connect: { id: branchId } },
      title: dto.title,
      description: dto.description ?? null,
      dayOfWeek: dto.dayOfWeek,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      isRecurring: dto.isRecurring ?? true,
      classroom: dto.classroomId ? { connect: { id: dto.classroomId } } : undefined,
      teacherProfile: dto.teacherProfileId ? { connect: { id: dto.teacherProfileId } } : undefined,
    };
  }

  private mapUpdateDtoToPrisma(
    dto: UpdateClassScheduleDto,
  ): Prisma.ClassScheduleUpdateInput {
    const data: Prisma.ClassScheduleUpdateInput = {};

    if (typeof dto.title !== 'undefined') {
      data.title = dto.title;
    }
    if (typeof dto.description !== 'undefined') {
      data.description = dto.description ?? null;
    }
    if (typeof dto.dayOfWeek !== 'undefined') {
      data.dayOfWeek = dto.dayOfWeek;
    }
    if (typeof dto.startTime !== 'undefined') {
      data.startTime = new Date(dto.startTime);
    }
    if (typeof dto.endTime !== 'undefined') {
      data.endTime = new Date(dto.endTime);
    }
    if (typeof dto.isRecurring !== 'undefined') {
      data.isRecurring = dto.isRecurring;
    }
    if (typeof dto.classroomId !== 'undefined') {
      data.classroom = dto.classroomId
        ? { connect: { id: dto.classroomId } }
        : { disconnect: true };
    }
    if (typeof dto.teacherProfileId !== 'undefined') {
      data.teacherProfile = dto.teacherProfileId
        ? { connect: { id: dto.teacherProfileId } }
        : { disconnect: true };
    }

    return data;
  }

  private buildAssignmentData(
    scheduleId: string,
    primaryInstructor?: StaffAssignmentInput,
    additionalStaff?: StaffAssignmentInput[],
  ): Prisma.StaffAssignmentCreateManyInput[] {
    const records: Prisma.StaffAssignmentCreateManyInput[] = [];

    if (primaryInstructor) {
      records.push(this.mapStaffAssignmentInput(scheduleId, primaryInstructor, StaffAssignmentRole.LEAD_TEACHER));
    }

    for (const member of additionalStaff ?? []) {
      records.push(this.mapStaffAssignmentInput(scheduleId, member));
    }

    return records;
  }

  private mapStaffAssignmentInput(
    scheduleId: string,
    input: StaffAssignmentInput,
    defaultRole: StaffAssignmentRole = StaffAssignmentRole.ASSISTANT,
  ): Prisma.StaffAssignmentCreateManyInput {
    return {
      scheduleId,
      userId: input.userId,
      role: input.role ?? defaultRole,
      assignedAt: input.assignedAt ? new Date(input.assignedAt) : new Date(),
    };
  }

  private async syncStaffAssignments(
    scheduleId: string,
    primaryInstructor?: StaffAssignmentInput,
    additionalStaff?: StaffAssignmentInput[],
  ): Promise<void> {
    const assignmentData = this.buildAssignmentData(scheduleId, primaryInstructor, additionalStaff);

    await this.prisma.$transaction(async (tx) => {
      await tx.staffAssignment.deleteMany({ where: { scheduleId } });

      if (assignmentData.length > 0) {
        await tx.staffAssignment.createMany({ data: assignmentData });
      }
    });
  }

  private async ensureBranch(branchId: string): Promise<void> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found`);
    }
  }

  private async ensureScheduleInBranch(branchId: string, scheduleId: string): Promise<ClassScheduleWithRelations> {
    await this.ensureBranch(branchId);

    const schedule = await this.prisma.classSchedule.findFirst({
      where: { id: scheduleId, branchId },
      include: this.defaultInclude,
    });

    if (!schedule) {
      throw new NotFoundException(`Class schedule ${scheduleId} not found in branch ${branchId}`);
    }

    return schedule as ClassScheduleWithRelations;
  }

  private resolveMinutes(value: string | Date): number {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date provided for class schedule time.');
    }

    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }

  private ensureValidTimeRange(startMinutes: number, endMinutes: number): void {
    if (endMinutes <= startMinutes) {
      throw new BadRequestException('Class end time must be greater than start time.');
    }
  }

  private resolveStaffUserIdsFromInputs(
    primaryInstructor: StaffAssignmentInput | undefined,
    additionalStaff: StaffAssignmentInput[] | undefined,
    teacherProfileUserId: string | null,
  ): string[] {
    const ids = new Set<string>();

    if (teacherProfileUserId) {
      ids.add(teacherProfileUserId);
    }

    if (primaryInstructor) {
      ids.add(primaryInstructor.userId);
    }

    for (const member of additionalStaff ?? []) {
      ids.add(member.userId);
    }

    return [...ids];
  }

  private resolveStaffUserIdsFromExistingAssignments(
    assignments: StaffAssignment[],
    teacherProfileUserId: string | null,
  ): string[] {
    const ids = new Set<string>();

    if (teacherProfileUserId) {
      ids.add(teacherProfileUserId);
    }

    for (const assignment of assignments) {
      ids.add(assignment.userId);
    }

    return [...ids];
  }

  private async resolveTeacherProfile(
    branchId: string,
    teacherProfileId: string | null,
    existingProfile?: ClassScheduleWithRelations['teacherProfile'],
  ): Promise<{ profile: TeacherProfile; userId: string } | null> {
    if (!teacherProfileId) {
      if (existingProfile) {
        return { profile: existingProfile, userId: existingProfile.userId };
      }
      return null;
    }

    if (existingProfile && existingProfile.id === teacherProfileId) {
      return { profile: existingProfile, userId: existingProfile.userId };
    }

    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
    });

    if (!profile) {
      throw new NotFoundException(`Teacher profile ${teacherProfileId} not found.`);
    }

    if (profile.branchId !== branchId) {
      throw new ConflictException('Selected teacher profile belongs to a different branch.');
    }

    return { profile, userId: profile.userId };
  }

  private async ensureClassroomBelongsToBranch(branchId: string, classroomId: string | null | undefined): Promise<void> {
    if (!classroomId) {
      return;
    }

    const classroom = await this.prisma.classroom.findUnique({ where: { id: classroomId } });

    if (!classroom) {
      throw new NotFoundException(`Classroom ${classroomId} not found.`);
    }

    if (classroom.branchId !== branchId) {
      throw new ConflictException('Selected classroom belongs to a different branch.');
    }
  }

  private async throwIfClashing(params: {
    branchId: string;
    dayOfWeek: ClassSchedule['dayOfWeek'];
    startMinutes: number;
    endMinutes: number;
    classroomId: string | null;
    teacherProfileId: string | null;
    staffUserIds: string[];
    excludeScheduleId?: string;
  }): Promise<void> {
    const {
      branchId,
      dayOfWeek,
      startMinutes,
      endMinutes,
      classroomId,
      teacherProfileId,
      staffUserIds,
      excludeScheduleId,
    } = params;

    const candidates = (await this.prisma.classSchedule.findMany({
      where: {
        branchId,
        dayOfWeek,
        ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
      },
      include: {
        classroom: true,
        teacherProfile: { include: { user: true } },
        assignments: true,
      },
      orderBy: [{ startTime: 'asc' }],
    })) as ClassScheduleWithRelations[];

    const classroomClashes: ClassScheduleWithRelations[] = [];
    const teacherProfileClashes: ClassScheduleWithRelations[] = [];
    const staffClashes: { schedule: ClassScheduleWithRelations; userIds: string[] }[] = [];

    for (const schedule of candidates) {
      const scheduleStart = this.resolveMinutes(schedule.startTime);
      const scheduleEnd = this.resolveMinutes(schedule.endTime);

      const overlaps = scheduleStart < endMinutes && scheduleEnd > startMinutes;

      if (!overlaps) {
        continue;
      }

      if (classroomId && schedule.classroomId && schedule.classroomId === classroomId) {
        classroomClashes.push(schedule);
      }

      if (teacherProfileId && schedule.teacherProfileId === teacherProfileId) {
        teacherProfileClashes.push(schedule);
      }

      if (staffUserIds.length > 0) {
        const conflictingUserIds = schedule.assignments
          .map((assignment) => assignment.userId)
          .filter((userId) => staffUserIds.includes(userId));

        if (conflictingUserIds.length > 0) {
          staffClashes.push({ schedule, userIds: conflictingUserIds });
        }
      }
    }

    if (classroomClashes.length === 0 && teacherProfileClashes.length === 0 && staffClashes.length === 0) {
      return;
    }

    const messages: string[] = [];
    if (classroomClashes.length > 0) {
      messages.push('Selected classroom is already booked for this time.');
    }
    if (teacherProfileClashes.length > 0) {
      messages.push('Lead teacher already has a class scheduled during this time.');
    }
    if (staffClashes.length > 0) {
      messages.push('One or more assigned staff members have another class at this time.');
    }

    const clashDetails: ClassScheduleClashDetails = {
      classroom: classroomClashes.map((schedule) => this.toScheduleSummary(schedule)),
      teacherProfiles: teacherProfileClashes.map((schedule) => this.toScheduleSummary(schedule)),
      staffAssignments: staffClashes.map(({ schedule, userIds }) => ({
        schedule: this.toScheduleSummary(schedule),
        userIds,
      })),
    };

    throw new ConflictException({
      message: messages.join(' '),
      clashes: clashDetails,
    });
  }

  private toScheduleSummary(schedule: ClassScheduleWithRelations) {
    return {
      id: schedule.id,
      title: schedule.title,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      classroom: schedule.classroom
        ? {
            id: schedule.classroom.id,
            name: schedule.classroom.name,
          }
        : null,
      teacherProfile: schedule.teacherProfile
        ? {
            id: schedule.teacherProfile.id,
            userId: schedule.teacherProfile.userId,
            user: schedule.teacherProfile.user
              ? {
                  id: schedule.teacherProfile.user.id,
                  firstName: schedule.teacherProfile.user.firstName,
                  lastName: schedule.teacherProfile.user.lastName,
                  email: schedule.teacherProfile.user.email,
                }
              : null,
          }
        : null,
    };
  }
}
