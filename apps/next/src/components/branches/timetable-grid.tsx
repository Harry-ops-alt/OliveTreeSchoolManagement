import { Fragment, useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import type { ClassSchedule } from '../../lib/types/class-schedules';

const DAY_ORDER: ClassSchedule['dayOfWeek'][] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const HOURS_IN_DAY = Array.from({ length: 12 }, (_, index) => index + 7);

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function getDayLabel(day: ClassSchedule['dayOfWeek']): string {
  return `${day.charAt(0)}${day.slice(1).toLowerCase()}`;
}

type TimetableGridProps = {
  schedules: ClassSchedule[];
};

export function TimetableGrid({ schedules }: TimetableGridProps): JSX.Element {
  const schedulesByDay = useMemo(() => {
    const grouped = new Map<ClassSchedule['dayOfWeek'], ClassSchedule[]>();

    for (const day of DAY_ORDER) {
      grouped.set(day, []);
    }

    for (const schedule of schedules) {
      const bucket = grouped.get(schedule.dayOfWeek);
      if (!bucket) {
        grouped.set(schedule.dayOfWeek, [schedule]);
        continue;
      }
      bucket.push(schedule);
    }

    for (const [, list] of grouped) {
      list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }

    return grouped;
  }, [schedules]);

  return (
    <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/40">
      <div className="flex items-center justify-between border-b border-emerald-700/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-emerald-400" aria-hidden />
          <div>
            <h3 className="text-lg font-semibold text-white">Weekly timetable</h3>
            <p className="text-xs text-emerald-100/70">Read-only view of scheduled classes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[72px_repeat(7,_minmax(0,_1fr))] gap-px border-t border-emerald-700/30 bg-emerald-700/30 text-xs text-emerald-100/80">
        <div className="sticky top-0 z-10 flex items-center justify-center bg-emerald-950/80 px-2 py-3 font-semibold text-white">
          Time
        </div>
        {DAY_ORDER.map((day) => (
          <div key={day} className="sticky top-0 z-10 flex items-center justify-center bg-emerald-950/80 px-2 py-3 font-semibold text-white">
            {getDayLabel(day)}
          </div>
        ))}

        {HOURS_IN_DAY.map((hour) => (
          <Fragment key={`row-${hour}`}>
            <div className="flex items-start justify-end bg-emerald-950/70 px-2 py-3 text-emerald-100/60">
              {new Intl.DateTimeFormat(undefined, {
                hour: 'numeric',
              }).format(new Date(new Date().setHours(hour, 0, 0, 0)))}
            </div>
            {DAY_ORDER.map((day) => (
              <div key={`${day}-${hour}`} className="min-h-[80px] bg-emerald-950/40 px-2 py-2">
                <DayCell
                  hour={hour}
                  schedules={schedulesByDay.get(day) ?? []}
                />
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

type DayCellProps = {
  hour: number;
  schedules: ClassSchedule[];
};

function DayCell({ hour, schedules }: DayCellProps): JSX.Element {
  const events = schedules.filter((schedule) => {
    const start = new Date(schedule.startTime);
    const end = new Date(schedule.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const cellStart = hour * 60;
    const cellEnd = (hour + 1) * 60;

    return startMinutes < cellEnd && endMinutes > cellStart;
  });

  if (events.length === 0) {
    return <div className="h-full rounded-xl border border-dashed border-emerald-700/20"></div>;
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {events.map((schedule) => (
        <div
          key={schedule.id}
          className="rounded-xl border border-emerald-600/50 bg-emerald-900/70 px-3 py-2 shadow-sm"
        >
          <p className="text-xs font-semibold text-white">{schedule.title}</p>
          <p className="text-[10px] uppercase tracking-wide text-emerald-100/60">{formatTimeRange(schedule.startTime, schedule.endTime)}</p>
          <p className="text-[11px] text-emerald-100/80">
            {schedule.classroom ? schedule.classroom.name : 'Unassigned room'}
          </p>
          <p className="text-[11px] text-emerald-100/60">
            {schedule.teacherProfile?.user
              ? `${schedule.teacherProfile.user.firstName ?? ''} ${schedule.teacherProfile.user.lastName ?? ''}`.trim() ||
                schedule.teacherProfile.user.email ||
                'Lead teacher'
              : 'No lead teacher'}
          </p>
        </div>
      ))}
    </div>
  );
}
