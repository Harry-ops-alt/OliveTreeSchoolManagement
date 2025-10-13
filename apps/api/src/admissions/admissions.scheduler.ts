import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService, TasterReminderWindow } from '../notifications/notification.service';
import { AdmissionsTasksService } from './admissions.tasks.service';

const HOUR_IN_MS = 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;
const REMINDER_TOLERANCE_MINUTES = 5;
const NO_SHOW_SWEEP_DELAY_HOURS = 24;

type ReminderSessionField = 'reminder24hScheduledAt' | 'reminder2hScheduledAt';
type ReminderAttendeeField = 'reminder24hNotifiedAt' | 'reminder2hNotifiedAt';

const REMINDER_SESSION_INCLUDE = {
  attendees: {
    select: {
      id: true,
      leadId: true,
      attendedAt: true,
      reminder24hNotifiedAt: true,
      reminder2hNotifiedAt: true,
    },
  },
} as const;

type ReminderSession = Prisma.AdmissionTasterSessionGetPayload<{ include: typeof REMINDER_SESSION_INCLUDE }>;
type ReminderAttendee = ReminderSession['attendees'][number];

const NO_SHOW_SESSION_INCLUDE = {
  attendees: {
    select: {
      id: true,
      leadId: true,
      attendedAt: true,
      noShowAt: true,
    },
  },
} as const;

type NoShowSession = Prisma.AdmissionTasterSessionGetPayload<{ include: typeof NO_SHOW_SESSION_INCLUDE }>;
type NoShowAttendee = NoShowSession['attendees'][number];

@Injectable()
export class AdmissionsScheduler {
  private readonly logger = new Logger(AdmissionsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly tasksService: AdmissionsTasksService,
  ) {}

  @Cron('* * * * *')
  async handleAdmissionsAutomation(): Promise<void> {
    const now = new Date();

    await this.handleReminderWindow(now, 24, 'reminder24hScheduledAt', 'reminder24hNotifiedAt', '24h');
    await this.handleReminderWindow(now, 2, 'reminder2hScheduledAt', 'reminder2hNotifiedAt', '2h');
    await this.handleNoShowSweep(now);
  }

  private async handleReminderWindow(
    now: Date,
    hoursAhead: number,
    sessionField: ReminderSessionField,
    attendeeField: ReminderAttendeeField,
    windowLabel: TasterReminderWindow,
  ): Promise<void> {
    const windowRange = computeReminderWindow(now, hoursAhead, REMINDER_TOLERANCE_MINUTES);

    const sessions = (await this.prisma.admissionTasterSession.findMany({
      where: {
        startTime: {
          gte: windowRange.start,
          lte: windowRange.end,
        },
        [sessionField]: null,
      } as Prisma.AdmissionTasterSessionWhereInput,
      include: REMINDER_SESSION_INCLUDE,
    })) as ReminderSession[];

    if (!sessions.length) {
      return;
    }

    for (const session of sessions) {
      const attendeesToNotify = session.attendees.filter((attendee) => {
        const reminderAttendee = attendee as ReminderAttendee;
        if (reminderAttendee.attendedAt) {
          return false;
        }
        const alreadyNotified = reminderAttendee[attendeeField];
        return !alreadyNotified;
      });

      let sessionStamped = false;

      await this.prisma.$transaction(async (tx) => {
        const updateResult = await tx.admissionTasterSession.updateMany({
          where: {
            id: session.id,
            [sessionField]: null,
          } as Prisma.AdmissionTasterSessionWhereInput,
          data: { [sessionField]: now } as Prisma.AdmissionTasterSessionUpdateManyMutationInput,
        });

        if (!updateResult.count) {
          return;
        }

        sessionStamped = true;

        for (const attendee of attendeesToNotify) {
          await tx.admissionTasterAttendee.update({
            where: { id: attendee.id },
            data: { [attendeeField]: now } as Prisma.AdmissionTasterAttendeeUpdateInput,
          });
        }
      });

      if (!sessionStamped) {
        continue;
      }

      for (const attendee of attendeesToNotify) {
        await this.notificationService.notifyTasterReminder({
          window: windowLabel,
          session: {
            id: session.id,
            title: session.title,
            branchId: session.branchId,
            startTime: session.startTime,
          },
          attendee: {
            id: attendee.id,
            leadId: attendee.leadId,
          },
        });
      }

      this.logger.debug(
        `Scheduled ${windowLabel} reminder for session ${session.id} (${attendeesToNotify.length} attendees)`,
      );
    }
  }

  private async handleNoShowSweep(now: Date): Promise<void> {
    const sweepThreshold = new Date(now.getTime() - NO_SHOW_SWEEP_DELAY_HOURS * HOUR_IN_MS);

    const sessions = (await this.prisma.admissionTasterSession.findMany({
      where: {
        endTime: { lte: sweepThreshold },
        noShowSweepCompletedAt: null,
      } as Prisma.AdmissionTasterSessionWhereInput,
      include: NO_SHOW_SESSION_INCLUDE,
    })) as NoShowSession[];

    if (!sessions.length) {
      return;
    }

    for (const session of sessions) {
      await this.prisma.$transaction(async (tx) => {
        const updateResult = await tx.admissionTasterSession.updateMany({
          where: {
            id: session.id,
            noShowSweepCompletedAt: null,
          } as Prisma.AdmissionTasterSessionWhereInput,
          data: { noShowSweepCompletedAt: now } as Prisma.AdmissionTasterSessionUpdateManyMutationInput,
        });

        if (!updateResult.count) {
          return;
        }

        const attendeesNeedingFollowUp = session.attendees.filter(
          (attendee) => !attendee.attendedAt && !(attendee as NoShowAttendee).noShowAt,
        ) as NoShowAttendee[];

        for (const attendee of attendeesNeedingFollowUp) {
          await tx.admissionTasterAttendee.update({
            where: { id: attendee.id },
            data: { noShowAt: now } as Prisma.AdmissionTasterAttendeeUpdateInput,
          });

          await this.tasksService.createNoShowFollowUp(tx, {
            leadId: attendee.leadId,
            sessionId: session.id,
            sessionTitle: session.title,
            sessionStart: session.startTime,
            branchId: session.branchId,
            now,
          });
        }

        if (attendeesNeedingFollowUp.length) {
          this.logger.debug(
            `Marked ${attendeesNeedingFollowUp.length} no-shows for session ${session.id} and created follow-up tasks`,
          );
        }
      });
    }
  }

}

export function computeReminderWindow(now: Date, hoursAhead: number, toleranceMinutes: number) {
  const offsetMs = hoursAhead * HOUR_IN_MS;
  const toleranceMs = toleranceMinutes * MINUTE_IN_MS;

  return {
    start: new Date(now.getTime() + offsetMs - toleranceMs),
    end: new Date(now.getTime() + offsetMs + toleranceMs),
  };
}
