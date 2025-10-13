import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdmissionsService } from './admissions.service';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsScheduler } from './admissions.scheduler';
import { AdmissionsTasksService } from './admissions.tasks.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  providers: [AdmissionsService, AdmissionsScheduler, AdmissionsTasksService],
  controllers: [AdmissionsController],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
