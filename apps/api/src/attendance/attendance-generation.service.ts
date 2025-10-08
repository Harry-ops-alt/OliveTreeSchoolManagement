import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AttendanceSessionStatus, ClassSchedule, DayOfWeek } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

interface GenerationWindow {
  start: Date;
  end: Date;
}

const DAY_OF_WEEK_TO_UTC_INDEX: Record<DayOfWeek, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
};

@Injectable()
export class AttendanceGenerationService {
  private readonly logger = new Logger(AttendanceGenerationService.name);
  private readonly horizonDays = Number(process.env.ATTENDANCE_GENERATION_HORIZON_DAYS ?? '14');
  private readonly lookBackDays = Number(process.env.ATTENDANCE_GENERATION_LOOKBACK_DAYS ?? '1');

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleScheduledGeneration(): Promise<void> {
    try {
      const created = await this.generateUpcomingSessions();
      if (created > 0) {
        this.logger.log(`Generated ${created} attendance session(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to generate attendance sessions', error as Error);
    }
  }

  async generateUpcomingSessions(referenceDate: Date = new Date()): Promise<number> {
    if (this.horizonDays < 0) {
      return 0;
    }

    const window = this.resolveGenerationWindow(referenceDate);

    const schedules = await this.prisma.classSchedule.findMany({
      where: {
        isRecurring: true,
      },
      select: {
        id: true,
        branchId: true,
        dayOfWeek: true,
        startTime: true,
      },
    });

    if (schedules.length === 0) {
      return 0;
    }

    const scheduleIds = schedules.map((schedule) => schedule.id);

    const existingSessions = await this.prisma.attendanceSession.findMany({
      where: {
        classScheduleId: { in: scheduleIds },
        date: {
          gte: window.start,
          lt: window.end,
        },
      },
      select: {
        classScheduleId: true,
        date: true,
      },
    });

    const existingLookup = new Set(
existingSessions
  .filter((s) => s.classScheduleId)
  .map((s) => this.buildSessionLookupKey(s.classScheduleId!, s.date)),
    );

    const sessionsToCreate: {
      branchId: string;
      classScheduleId: string;
      date: Date;
      status: AttendanceSessionStatus;
    }[] = [];

    for (const schedule of schedules) {
      const utcDayIndex = DAY_OF_WEEK_TO_UTC_INDEX[schedule.dayOfWeek];
      if (typeof utcDayIndex === 'undefined') {
        continue;
      }

      for (let cursor = new Date(window.start); cursor < window.end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
        if (cursor.getUTCDay() !== utcDayIndex) {
          continue;
        }

        const sessionDate = this.buildSessionDate(cursor, schedule);
        const key = this.buildSessionLookupKey(schedule.id, sessionDate);

        if (existingLookup.has(key)) {
          continue;
        }

        sessionsToCreate.push({
          branchId: schedule.branchId,
          classScheduleId: schedule.id,
          date: sessionDate,
          status: AttendanceSessionStatus.OPEN,
        });
        existingLookup.add(key);
      }
    }

    if (sessionsToCreate.length === 0) {
      return 0;
    }

    const result = await this.prisma.attendanceSession.createMany({
      data: sessionsToCreate,
    });

    return result.count ?? sessionsToCreate.length;
  }

  private resolveGenerationWindow(referenceDate: Date): GenerationWindow {
    const today = this.startOfDay(referenceDate);
    const start = this.addDays(today, -Math.max(0, this.lookBackDays));
    const end = this.addDays(today, Math.max(0, this.horizonDays) + 1);

    return { start, end };
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setUTCHours(0, 0, 0, 0);
    return copy;
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
  }

  private buildSessionLookupKey(classScheduleId: string, date: Date): string {
    return `${classScheduleId}:${date.toISOString()}`;
  }

  private buildSessionDate(baseDate: Date, schedule: Pick<ClassSchedule, 'startTime'>): Date {
    const target = new Date(baseDate);
    const startTime = schedule.startTime;
    target.setUTCHours(startTime.getUTCHours(), startTime.getUTCMinutes(), 0, 0);
    return target;
  }
}
