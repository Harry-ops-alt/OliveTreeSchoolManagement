import { Injectable, Logger } from '@nestjs/common';

export type TasterReminderWindow = '24h' | '2h';

export interface TasterReminderPayload {
  window: TasterReminderWindow;
  session: {
    id: string;
    title: string;
    branchId: string;
    startTime: Date;
  };
  attendee: {
    id: string;
    leadId: string;
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async notifyTasterReminder(payload: TasterReminderPayload): Promise<void> {
    this.logger.log(
      `Queued ${payload.window} reminder for lead ${payload.attendee.leadId} on session ${payload.session.id} (${payload.session.title})`,
    );
    // TODO: Integrate email/SMS delivery once channel providers are ready.
  }
}
