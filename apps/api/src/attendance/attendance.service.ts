import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceSessionStatus,
  AttendanceStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SessionUserData } from '../users/users.service';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { SubmitAttendanceRecordsDto } from './dto/submit-attendance-records.dto';
import { ListAttendanceSessionsDto } from './dto/list-attendance-sessions.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    user: SessionUserData,
    dto: CreateAttendanceSessionDto,
  ) {
    const branch = await this.ensureBranchAccess(user, dto.branchId);

    let classScheduleId: string | null = null;
    if (dto.classScheduleId) {
      const schedule = await this.prisma.classSchedule.findUnique({
        where: { id: dto.classScheduleId },
        select: { branchId: true },
      });

      if (!schedule) {
        throw new NotFoundException('Class schedule not found');
      }

      if (schedule.branchId !== branch.id) {
        throw new ForbiddenException('Class schedule does not belong to branch');
      }

      classScheduleId = schedule ? dto.classScheduleId : null;
    }

    const session = await this.prisma.attendanceSession.create({
      data: {
        branchId: branch.id,
        classScheduleId,
        date: new Date(dto.date),
        status: AttendanceSessionStatus.OPEN,
        notes: dto.notes ?? null,
        createdById: user.id,
      },
    });

    return session;
  }

  async listSessions(user: SessionUserData, query: ListAttendanceSessionsDto) {
    const where: Prisma.AttendanceSessionWhereInput = {};

    if (query.branchId) {
      await this.ensureBranchAccess(user, query.branchId);
      where.branchId = query.branchId;
    } else if (user.branchId) {
      where.branchId = user.branchId;
    } else if (user.orgId) {
      where.branch = { organizationId: user.orgId };
    }

    if (query.classScheduleId) {
      where.classScheduleId = query.classScheduleId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      where.date = {};
      if (query.fromDate) {
        where.date.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.date.lte = new Date(query.toDate);
      }
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        branch: { select: { id: true, name: true } },
        classSchedule: { select: { id: true, title: true, startTime: true } },
        _count: { select: { records: true } },
      },
    });

    const sessionIds = sessions.map((session) => session.id);

    const recordsBySession = await this.prisma.attendanceRecord.groupBy({
      by: ['sessionId', 'status'],
      where: { sessionId: { in: sessionIds } },
      _count: { sessionId: true },
    });

    return sessions.map((session) => {
      const counts = recordsBySession.filter(
        (group) => group.sessionId === session.id,
      );

      const statusCounts: Partial<Record<AttendanceStatus, number>> = {};
      for (const group of counts) {
        statusCounts[group.status as AttendanceStatus] = group._count.sessionId;
      }

      return {
        ...session,
        statusCounts,
      };
    });
  }

  async getSession(user: SessionUserData, sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        branch: { select: { id: true, name: true, organizationId: true } },
        classSchedule: { select: { id: true, title: true } },
        records: {
          select: {
            id: true,
            status: true,
            notes: true,
            recordedAt: true,
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    this.assertSessionAccess(user, session.branch);

    return session;
  }

  async submitRecords(
    user: SessionUserData,
    sessionId: string,
    dto: SubmitAttendanceRecordsDto,
  ) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { branch: { select: { id: true, organizationId: true } } },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    this.assertSessionAccess(user, session.branch);

    if (!dto.records.length) {
      return this.getSession(user, sessionId);
    }

    await this.prisma.$transaction(async (tx) => {
      for (const record of dto.records) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status,
            notes: record.notes ?? null,
            recordedById: user.id,
            recordedAt: new Date(),
          },
          create: {
            sessionId,
            studentId: record.studentId,
            status: record.status,
            notes: record.notes ?? null,
            recordedById: user.id,
            recordedAt: new Date(),
          },
        });
      }

      const updateData: Prisma.AttendanceSessionUpdateInput = {
        status: dto.finalize
          ? AttendanceSessionStatus.FINALIZED
          : AttendanceSessionStatus.SUBMITTED,
        submittedAt: new Date(),
      };

      if (dto.finalize) {
        updateData.finalizedAt = new Date();
      }

      await tx.attendanceSession.update({
        where: { id: sessionId },
        data: updateData,
      });
    });

    return this.getSession(user, sessionId);
  }

  async listStudentAttendance(user: SessionUserData, studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        branch: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.branch) {
      throw new NotFoundException('Student branch not found');
    }

    this.assertSessionAccess(user, student.branch);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
      },
      orderBy: {
        session: {
          date: 'desc',
        },
      },
      include: {
        session: {
          select: {
            id: true,
            date: true,
            status: true,
            notes: true,
            branch: { select: { id: true, name: true } },
            classSchedule: { select: { id: true, title: true } },
          },
        },
      },
    });

    return records.map((record) => ({
      session: {
        id: record.session.id,
        date: record.session.date,
        status: record.session.status,
        notes: record.session.notes,
        branch: record.session.branch,
        classSchedule: record.session.classSchedule,
      },
      record: {
        status: record.status,
        notes: record.notes,
        recordedAt: record.recordedAt,
      },
    }));
  }

  private async ensureBranchAccess(user: SessionUserData, branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, organizationId: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (user.orgId && branch.organizationId !== user.orgId) {
      throw new ForbiddenException('Branch does not belong to your organization');
    }

    if (user.branchId && user.branchId !== branchId) {
      throw new ForbiddenException('Cannot manage attendance for another branch');
    }

    return branch;
  }

  private assertSessionAccess(
    user: SessionUserData,
    branch: { id: string; organizationId: string },
  ) {
    if (user.orgId && branch.organizationId !== user.orgId) {
      throw new ForbiddenException('Attendance session not in your organization');
    }

    if (user.branchId && user.branchId !== branch.id) {
      throw new ForbiddenException('Attendance session not in your branch');
    }
  }
}
