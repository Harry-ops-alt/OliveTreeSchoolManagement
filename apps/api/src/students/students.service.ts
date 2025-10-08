import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SessionUserData } from '../users/users.service.js';
import {
  DEFAULT_STUDENT_PAGE_SIZE,
  MAX_STUDENT_PAGE_SIZE,
  GenderValue,
  StudentStatusValue,
} from './students.constants.js';
import { ListStudentsDto } from './dto/list-students.dto.js';
import {
  CreateStudentDto,
  GuardianLinkDto,
  InlineGuardianDto,
} from './dto/create-student.dto.js';
import {
  UpdateStudentDto,
  UpdateGuardianLinkDto,
  UpdateInlineGuardianDto,
} from './dto/update-student.dto.js';

const studentInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  branch: {
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  },
  classroom: {
    select: {
      id: true,
      name: true,
      branchId: true,
    },
  },
  guardians: {
    include: {
      guardian: true,
    },
  },
  admissions: {
    orderBy: { appliedAt: 'desc' },
  },
  classEnrollments: {
    include: {
      classSchedule: {
        select: {
          id: true,
          title: true,
          branchId: true,
          classroomId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  },
} as const;

type StudentWithRelations = Record<string, any>;

type PreparedGuardianLink = {
  studentId: string;
  guardianId: string;
  relationship: string | null;
  isPrimary: boolean;
  contactOrder: number;
};

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    user: SessionUserData,
    filters: ListStudentsDto,
  ): Promise<{
    data: StudentWithRelations[];
    meta: { total: number; page: number; pageSize: number; totalPages: number };
  }> {
    const page = filters.page ?? 1;
    const rawPageSize = filters.pageSize ?? DEFAULT_STUDENT_PAGE_SIZE;
    const pageSize = Math.min(Math.max(rawPageSize, 1), MAX_STUDENT_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const where: Record<string, any> = {};

    if (filters.branchId) {
      await this.ensureBranchAccess(user, filters.branchId);
      where.branchId = filters.branchId;
    } else if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.orgId) {
      where.branch = { organizationId: user.orgId };
    }

    if (!filters.includeArchived) {
      where.isArchived = false;
    }

    if (filters.status) {
      where.status = filters.status as StudentStatusValue;
    }

    if (filters.gradeLevel) {
      where.gradeLevel = {
        contains: filters.gradeLevel,
        mode: 'insensitive',
      };
    }

    if (filters.search) {
      const search = filters.search.trim();
      if (search.length) {
        const orFilters: Record<string, any>[] = [
          {
            studentNumber: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            user: {
              is: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
          {
            guardians: {
              some: {
                guardian: {
                  OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
        ];

        where.OR = orFilters;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where: where as any,
        include: studentInclude as any,
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } },
          { studentNumber: 'asc' },
        ] as any,
        skip,
        take: pageSize,
      } as any),
      this.prisma.studentProfile.count({ where: where as any }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  }

  async getById(user: SessionUserData, id: string): Promise<StudentWithRelations> {
    const student = await this.getStudentById(this.prisma, id);
    if (!student) {
      throw new NotFoundException(`Student ${id} not found`);
    }
    this.assertStudentAccess(user, student);
    return student;
  }

  async create(
    user: SessionUserData,
    dto: CreateStudentDto,
  ): Promise<StudentWithRelations> {
    if (!dto.userId) {
      throw new BadRequestException('userId is required to create a student profile');
    }

    const branch = await this.ensureBranchAccess(user, dto.branchId);

    if (dto.orgId !== branch.organizationId) {
      throw new BadRequestException('Provided orgId does not match branch organization');
    }

    const classroomId = await this.validateClassroom(branch.id, dto.classroomId);
    const classScheduleIds = await this.validateClassSchedules(
      branch.id,
      dto.classScheduleIds,
    );

    const studentUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, organizationId: true, branchId: true },
    });

    if (!studentUser) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    if (
      studentUser.organizationId &&
      studentUser.organizationId !== branch.organizationId
    ) {
      throw new ForbiddenException('User belongs to another organization');
    }

    if (studentUser.branchId && studentUser.branchId !== branch.id) {
      throw new ForbiddenException('User belongs to another branch');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const prismaTx = (tx as any) ?? this.prisma;
      const userClient = prismaTx.user ?? this.prisma.user;
      const studentClient = prismaTx.studentProfile ?? this.prisma.studentProfile;

      await userClient.update({
        where: { id: dto.userId! },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          organizationId: branch.organizationId,
          branchId: branch.id,
        },
      });

      const student = await studentClient.create({
        data: this.mapStudentCreateData(dto, branch.id, classroomId ?? null) as any,
        include: studentInclude as any,
      } as any);

      if (classScheduleIds?.length) {
        await prismaTx.studentClassEnrollment.createMany({
          data: classScheduleIds.map((scheduleId) => ({
            studentId: student.id,
            classScheduleId: scheduleId,
          })),
          skipDuplicates: true,
        });
      }

      await this.syncGuardians(tx, {
        studentId: student.id,
        orgId: branch.organizationId,
        branchId: branch.id,
        guardians: dto.guardians,
        inlineGuardians: dto.inlineGuardians,
      });

      return this.getStudentById(tx, student.id);
    });

    if (!result) {
      throw new NotFoundException('Failed to load created student');
    }

    return result;
  }

  async update(
    user: SessionUserData,
    id: string,
    dto: UpdateStudentDto,
  ): Promise<StudentWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const prismaTx = (tx as any) ?? this.prisma;
      const userClient = prismaTx.user ?? this.prisma.user;
      const studentClient = prismaTx.studentProfile ?? this.prisma.studentProfile;

      const existing = await this.getStudentById(tx, id);
      if (!existing) {
        throw new NotFoundException(`Student ${id} not found`);
      }

      this.assertStudentAccess(user, existing);

      let branchOrgId = existing.branch.organizationId;
      let branchId = existing.branchId;

      if (dto.branchId && dto.branchId !== existing.branchId) {
        const newBranch = await this.ensureBranchAccess(user, dto.branchId);
        branchOrgId = newBranch.organizationId;
        branchId = newBranch.id;
      }

      const classroomId = await this.validateClassroom(branchId, dto.classroomId);
      const classScheduleIds = await this.validateClassSchedules(branchId, dto.classScheduleIds);

      const studentData = this.mapStudentUpdateData(dto, branchId, classroomId);

      if (Object.keys(studentData).length) {
        await studentClient.update({
          where: { id },
          data: studentData as any,
        } as any);
      }

      const userUpdates: Record<string, unknown> = {};
      if (typeof dto.firstName !== 'undefined') {
        userUpdates.firstName = dto.firstName;
      }
      if (typeof dto.lastName !== 'undefined') {
        userUpdates.lastName = dto.lastName;
      }
      if (typeof dto.branchId !== 'undefined') {
        userUpdates.branchId = branchId;
      }
      if (Object.keys(userUpdates).length) {
        await userClient.update({
          where: { id: existing.userId },
          data: userUpdates,
        });
      }

      if (typeof classScheduleIds !== 'undefined') {
        await prismaTx.studentClassEnrollment.deleteMany({ where: { studentId: id } });

        if (classScheduleIds.length) {
          await prismaTx.studentClassEnrollment.createMany({
            data: classScheduleIds.map((scheduleId) => ({
              studentId: id,
              classScheduleId: scheduleId,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (
        typeof dto.guardians !== 'undefined' ||
        typeof dto.inlineGuardians !== 'undefined'
      ) {
        await this.syncGuardians(tx, {
          studentId: id,
          orgId: branchOrgId,
          branchId,
          guardians: dto.guardians,
          inlineGuardians: dto.inlineGuardians,
        });
      }

      const refreshed = await this.getStudentById(tx, id);
      if (!refreshed) {
        throw new NotFoundException(`Student ${id} not found after update`);
      }
      return refreshed;
    });
  }

  async archive(user: SessionUserData, id: string): Promise<StudentWithRelations> {
    const existing = await this.getStudentById(this.prisma, id);
    if (!existing) {
      throw new NotFoundException(`Student ${id} not found`);
    }
    this.assertStudentAccess(user, existing);

    await this.prisma.studentProfile.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: existing.archivedAt ?? new Date(),
      } as any,
    } as any);

    return this.getById(user, id);
  }

  private async syncGuardians(
    tx: unknown,
    params: {
      studentId: string;
      orgId: string;
      branchId: string;
      guardians?: (GuardianLinkDto | UpdateGuardianLinkDto)[];
      inlineGuardians?: (InlineGuardianDto | UpdateInlineGuardianDto)[];
    },
  ): Promise<void> {
    const prismaLike = (tx as any) ?? this.prisma;
    const links = await this.prepareGuardianLinks(prismaLike, params);

    await prismaLike.studentGuardian.deleteMany({ where: { studentId: params.studentId } } as any);

    if (!links.length) {
      return;
    }

    const ordered = [...links].sort((a, b) => a.contactOrder - b.contactOrder);

    for (const [index, link] of ordered.entries()) {
      await prismaLike.studentGuardian.create({
        data: {
          studentId: params.studentId,
          guardianId: link.guardianId,
          relationship: link.relationship,
          isPrimary: link.isPrimary,
          contactOrder: link.contactOrder || index + 1,
        } as any,
      } as any);
    }
  }

  private async prepareGuardianLinks(
    tx: any,
    params: {
      studentId: string;
      orgId: string;
      branchId: string;
      guardians?: (GuardianLinkDto | UpdateGuardianLinkDto)[];
      inlineGuardians?: (InlineGuardianDto | UpdateInlineGuardianDto)[];
    },
  ): Promise<PreparedGuardianLink[]> {
    const results: PreparedGuardianLink[] = [];
    const seen = new Set<string>();
    let fallbackOrder = 1;

    const pushLink = (
      studentId: string,
      guardianId: string,
      relationship: string | null,
      isPrimary: boolean,
      contactOrder?: number,
    ) => {
      if (seen.has(guardianId)) {
        return;
      }
      const order =
        typeof contactOrder === 'number' && contactOrder > 0
          ? contactOrder
          : fallbackOrder++;
      results.push({
        studentId,
        guardianId,
        relationship,
        isPrimary,
        contactOrder: order,
      });
      seen.add(guardianId);
    };

    if (params.inlineGuardians?.length) {
      for (const guardianDto of params.inlineGuardians) {
        let guardianId = guardianDto.id ?? null;

        if (guardianId) {
          const existingGuardian = await tx.guardian.findFirst({
            where: {
              id: guardianId,
              organizationId: params.orgId,
            },
          });

          if (!existingGuardian) {
            throw new NotFoundException(
              `Guardian ${guardianId} not found in organization`,
            );
          }

          await tx.guardian.update({
            where: { id: guardianId },
            data: this.buildGuardianUpdateData(guardianDto, params.branchId) as any,
          } as any);
        } else {
          const created = await tx.guardian.create({
            data: this.buildGuardianCreateData(guardianDto, params.orgId, params.branchId) as any,
          } as any);
          guardianId = created.id;
        }

        if (!guardianId) {
          throw new BadRequestException('guardianId is required');
        }

        // choose the real student id available in this function:
        const studentId = params.studentId; // if params carries it; otherwise replace with the correct variable like student.id

        pushLink(
          studentId,
          guardianId,
          guardianDto.relationship ?? null,
          guardianDto.isPrimary ?? false,
          guardianDto.order,
        );
      }
    }

    if (params.guardians?.length) {
      for (const guardianDto of params.guardians) {
        if (!guardianDto.guardianId) {
          throw new BadRequestException('guardianId is required when linking a guardian');
        }

        const guardian = await tx.guardian.findFirst({
          where: {
            id: guardianDto.guardianId,
            organizationId: params.orgId,
          },
        });

        if (!guardian) {
          throw new NotFoundException(
            `Guardian ${guardianDto.guardianId} not found in organization`,
          );
        }

        if (!guardian.branchId) {
          await tx.guardian.update({
            where: { id: guardian.id },
            data: { branchId: params.branchId } as any,
          } as any);
        }
        pushLink(
          params.studentId,
          guardian.id,
          guardianDto.relationship ?? null,
          guardianDto.isPrimary ?? false,
          guardianDto.order,
        );
      }
    }

    return results;
  }

  private mapStudentCreateData(
    dto: CreateStudentDto,
    branchId: string,
    classroomId: string | null,
  ): Record<string, unknown> {
    return {
      user: { connect: { id: dto.userId! } },
      branch: { connect: { id: branchId } },
      classroom: classroomId ? { connect: { id: classroomId } } : undefined,
      studentNumber: dto.studentNumber,
      dateJoined: dto.dateJoined ? new Date(dto.dateJoined) : undefined,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      alternatePhone: dto.alternatePhone ?? null,
      enrollmentDate: dto.enrollmentDate ? new Date(dto.enrollmentDate) : undefined,
      status: (dto.status ?? 'PROSPECT') as StudentStatusValue,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      gender: dto.gender ?? null,
      gradeLevel: dto.gradeLevel ?? null,
      homeroom: dto.homeroom ?? null,
      primaryLanguage: dto.primaryLanguage ?? null,
      additionalSupportNotes: dto.additionalSupportNotes ?? null,
      medicalNotes: dto.medicalNotes ?? null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      city: dto.city ?? null,
      state: dto.state ?? null,
      postalCode: dto.postalCode ?? null,
      country: dto.country ?? null,
      notes: dto.notes ?? null,
    };
  }

  private mapStudentUpdateData(
    dto: UpdateStudentDto,
    branchId: string,
    classroomId: string | null,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    if (typeof dto.branchId !== 'undefined') {
      data.branch = { connect: { id: branchId } };
    }
    if (typeof dto.classroomId !== 'undefined') {
      data.classroom = classroomId ? { connect: { id: classroomId } } : { disconnect: true };
    }
    if (typeof dto.studentNumber !== 'undefined') {
      data.studentNumber = dto.studentNumber;
    }
    if (typeof dto.email !== 'undefined') {
      data.email = dto.email ?? null;
    }
    if (typeof dto.phone !== 'undefined') {
      data.phone = dto.phone ?? null;
    }
    if (typeof dto.alternatePhone !== 'undefined') {
      data.alternatePhone = dto.alternatePhone ?? null;
    }
    if (typeof dto.enrollmentDate !== 'undefined') {
      data.enrollmentDate = dto.enrollmentDate
        ? new Date(dto.enrollmentDate)
        : undefined;
    }
    if (typeof dto.status !== 'undefined') {
      data.status = dto.status as StudentStatusValue;
    }
    if (typeof dto.dateOfBirth !== 'undefined') {
      data.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    }
    if (typeof dto.gender !== 'undefined') {
      data.gender = dto.gender ?? null;
    }
    if (typeof dto.gradeLevel !== 'undefined') {
      data.gradeLevel = dto.gradeLevel ?? null;
    }
    if (typeof dto.homeroom !== 'undefined') {
      data.homeroom = dto.homeroom ?? null;
    }
    if (typeof dto.primaryLanguage !== 'undefined') {
      data.primaryLanguage = dto.primaryLanguage ?? null;
    }
    if (typeof dto.additionalSupportNotes !== 'undefined') {
      data.additionalSupportNotes = dto.additionalSupportNotes ?? null;
    }
    if (typeof dto.medicalNotes !== 'undefined') {
      data.medicalNotes = dto.medicalNotes ?? null;
    }
    if (typeof dto.addressLine1 !== 'undefined') {
      data.addressLine1 = dto.addressLine1 ?? null;
    }
    if (typeof dto.addressLine2 !== 'undefined') {
      data.addressLine2 = dto.addressLine2 ?? null;
    }
    if (typeof dto.city !== 'undefined') {
      data.city = dto.city ?? null;
    }
    if (typeof dto.state !== 'undefined') {
      data.state = dto.state ?? null;
    }
    if (typeof dto.postalCode !== 'undefined') {
      data.postalCode = dto.postalCode ?? null;
    }
    if (typeof dto.country !== 'undefined') {
      data.country = dto.country ?? null;
    }
    if (typeof dto.notes !== 'undefined') {
      data.notes = dto.notes ?? null;
    }
    if (typeof dto.dateJoined !== 'undefined') {
      data.dateJoined = dto.dateJoined ? new Date(dto.dateJoined) : undefined;
    }
    if (typeof dto.archive !== 'undefined') {
      data.isArchived = dto.archive;
      data.archivedAt = dto.archive
        ? dto.archivedAt
          ? new Date(dto.archivedAt)
          : new Date()
        : null;
    }
    if (typeof dto.archivedAt !== 'undefined') {
      data.archivedAt = dto.archivedAt ? new Date(dto.archivedAt) : null;
    }

    return data;
  }

  private async validateClassroom(
    branchId: string,
    classroomId?: string,
  ): Promise<string | null> {
    if (!classroomId) {
      return null;
    }

    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, branchId: true },
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom ${classroomId} not found`);
    }

    if (classroom.branchId !== branchId) {
      throw new ForbiddenException('Classroom does not belong to branch');
    }

    return classroom.id;
  }

  private async validateClassSchedules(
    branchId: string,
    classScheduleIds?: string[],
  ): Promise<string[] | undefined> {
    if (typeof classScheduleIds === 'undefined') {
      return undefined;
    }

    if (!classScheduleIds.length) {
      return [];
    }

    const uniqueIds = Array.from(new Set(classScheduleIds));

    const schedules = await this.prisma.classSchedule.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, branchId: true },
    });

    if (schedules.length !== uniqueIds.length) {
      const found = new Set(schedules.map((schedule) => schedule.id));
      const missing = uniqueIds.find((id) => !found.has(id));
      throw new NotFoundException(`Class schedule ${missing} not found`);
    }

    for (const schedule of schedules) {
      if (schedule.branchId !== branchId) {
        throw new ForbiddenException('Class schedule does not belong to branch');
      }
    }

    return uniqueIds;
  }

  private async ensureBranchAccess(
    user: SessionUserData,
    branchId: string,
  ): Promise<{ id: string; organizationId: string }> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, organizationId: true },
    });

    if (!branch) {
      throw new NotFoundException(`Branch ${branchId} not found`);
    }

    if (user.branchId && user.branchId !== branchId) {
      throw new ForbiddenException('You are not allowed to access this branch');
    }

    if (user.orgId && user.orgId !== branch.organizationId) {
      throw new ForbiddenException('You are not allowed to access this organization');
    }

    return branch;
  }

  private assertStudentAccess(
    user: SessionUserData,
    student: StudentWithRelations,
  ): void {
    if (user.branchId && user.branchId !== student.branchId) {
      throw new ForbiddenException('You are not allowed to access this student');
    }
    const studentOrgId =
      student.branch?.organizationId ??
      student.organizationId ??
      student.orgId ??
      null;
    if (user.orgId && studentOrgId && user.orgId !== studentOrgId) {
      throw new ForbiddenException('You are not allowed to access this student');
    }
  }

  private buildGuardianCreateData(
    guardian: InlineGuardianDto | UpdateInlineGuardianDto,
    orgId: string,
    branchId: string,
  ): Record<string, unknown> {
    if (!guardian.firstName || !guardian.lastName) {
      throw new BadRequestException('firstName and lastName are required for new guardians');
    }

    return {
      id: guardian.id,
      organization: { connect: { id: orgId } },
      branch: { connect: { id: branchId } },
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email ?? null,
      phone: guardian.phone ?? null,
      alternatePhone: guardian.alternatePhone ?? null,
      addressLine1: guardian.addressLine1 ?? null,
      addressLine2: guardian.addressLine2 ?? null,
      city: guardian.city ?? null,
      state: guardian.state ?? null,
      postalCode: guardian.postalCode ?? null,
      country: guardian.country ?? null,
      notes: guardian.notes ?? null,
    };
  }

  private buildGuardianUpdateData(
    guardian: UpdateInlineGuardianDto,
    branchId: string,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {
      branch: { connect: { id: branchId } },
    };

    if (typeof guardian.firstName !== 'undefined') {
      data.firstName = guardian.firstName;
    }
    if (typeof guardian.lastName !== 'undefined') {
      data.lastName = guardian.lastName;
    }
    if (typeof guardian.email !== 'undefined') {
      data.email = guardian.email ?? null;
    }
    if (typeof guardian.phone !== 'undefined') {
      data.phone = guardian.phone ?? null;
    }
    if (typeof guardian.alternatePhone !== 'undefined') {
      data.alternatePhone = guardian.alternatePhone ?? null;
    }
    if (typeof guardian.addressLine1 !== 'undefined') {
      data.addressLine1 = guardian.addressLine1 ?? null;
    }
    if (typeof guardian.addressLine2 !== 'undefined') {
      data.addressLine2 = guardian.addressLine2 ?? null;
    }
    if (typeof guardian.city !== 'undefined') {
      data.city = guardian.city ?? null;
    }
    if (typeof guardian.state !== 'undefined') {
      data.state = guardian.state ?? null;
    }
    if (typeof guardian.postalCode !== 'undefined') {
      data.postalCode = guardian.postalCode ?? null;
    }
    if (typeof guardian.country !== 'undefined') {
      data.country = guardian.country ?? null;
    }
    if (typeof guardian.notes !== 'undefined') {
      data.notes = guardian.notes ?? null;
    }

    return data;
  }

  private async getStudentById(
    client: unknown,
    id: string,
  ): Promise<StudentWithRelations | null> {
    const candidate = client as any;
    const prismaLike = candidate && candidate.studentProfile ? candidate : this.prisma;
    return prismaLike.studentProfile.findUnique({
      where: { id },
      include: studentInclude as any,
    });
  }
}
