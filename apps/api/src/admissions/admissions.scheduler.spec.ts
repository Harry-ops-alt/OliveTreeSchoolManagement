import { AdmissionsScheduler, computeReminderWindow } from './admissions.scheduler';
import { NotificationService } from '../notifications/notification.service';
import { AdmissionsTasksService } from './admissions.tasks.service';
import { PrismaService } from '../prisma/prisma.service';

const HOURS_24_MS = 24 * 60 * 60 * 1000;

const createSchedulerTestHarness = () => {
  const prismaMock = {
    admissionTasterSession: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const notificationServiceMock = {
    notifyTasterReminder: jest.fn().mockResolvedValue(undefined),
  } as unknown as NotificationService;

  const tasksServiceMock = {
    createNoShowFollowUp: jest.fn().mockResolvedValue(undefined),
  } as unknown as AdmissionsTasksService;

  const scheduler = new AdmissionsScheduler(prismaMock, notificationServiceMock, tasksServiceMock);

  return {
    scheduler,
    prismaMock,
    notificationServiceMock,
    tasksServiceMock,
  };
};

describe('computeReminderWindow', () => {
  it('returns window spanning ± tolerance around target offset', () => {
    const now = new Date('2025-01-01T00:00:00.000Z');
    const { start, end } = computeReminderWindow(now, 24, 5);

    expect(start.toISOString()).toBe('2025-01-01T23:55:00.000Z');
    expect(end.toISOString()).toBe('2025-01-02T00:05:00.000Z');
  });
});

describe('AdmissionsScheduler reminder handling', () => {
  const buildSession = () => {
    const now = new Date('2025-01-01T00:00:00.000Z');
    const sessionStart = new Date(now.getTime() + HOURS_24_MS);

    const session = {
      id: 'session-1',
      branchId: 'branch-1',
      title: 'Robotics Taster',
      startTime: sessionStart,
      endTime: new Date(sessionStart.getTime() + 60 * 60 * 1000),
      reminder24hScheduledAt: null,
      reminder2hScheduledAt: null,
      noShowSweepCompletedAt: null,
      attendees: [
        {
          id: 'attendee-1',
          leadId: 'lead-1',
          attendedAt: null,
          reminder24hNotifiedAt: null,
          reminder2hNotifiedAt: null,
        },
      ],
    };

    return { now, session };
  };

  it('stamps reminders and notifies attendees once when within window', async () => {
    const { scheduler, prismaMock, notificationServiceMock } = createSchedulerTestHarness();
    const { now, session } = buildSession();

    const updateManyMock = jest.fn().mockResolvedValue({ count: 1 });
    const attendeeUpdateMock = jest.fn().mockResolvedValue(undefined);

    (prismaMock.admissionTasterSession.findMany as jest.Mock).mockResolvedValue([session]);
    (prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
      await callback({
        admissionTasterSession: { updateMany: updateManyMock },
        admissionTasterAttendee: { update: attendeeUpdateMock },
      });
    });

    await (scheduler as any).handleReminderWindow(now, 24, 'reminder24hScheduledAt', 'reminder24hNotifiedAt', '24h');

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(attendeeUpdateMock).toHaveBeenCalledWith({
      where: { id: 'attendee-1' },
      data: { reminder24hNotifiedAt: now },
    });
    expect(notificationServiceMock.notifyTasterReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        window: '24h',
        session: expect.objectContaining({ id: 'session-1' }),
        attendee: expect.objectContaining({ id: 'attendee-1' }),
      }),
    );
  });

  it('does not send duplicate reminders when already stamped', async () => {
    const { scheduler, prismaMock, notificationServiceMock } = createSchedulerTestHarness();
    const { now, session } = buildSession();

    const updateManyMock = jest.fn().mockResolvedValue({ count: 0 });
    const attendeeUpdateMock = jest.fn().mockResolvedValue(undefined);

    (prismaMock.admissionTasterSession.findMany as jest.Mock).mockResolvedValue([session]);
    (prismaMock.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
      await callback({
        admissionTasterSession: { updateMany: updateManyMock },
        admissionTasterAttendee: { update: attendeeUpdateMock },
      });
    });

    await (scheduler as any).handleReminderWindow(now, 24, 'reminder24hScheduledAt', 'reminder24hNotifiedAt', '24h');

    expect(attendeeUpdateMock).not.toHaveBeenCalled();
    expect(notificationServiceMock.notifyTasterReminder).not.toHaveBeenCalled();
  });
});
