import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller.js';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module.js';
import { OrgsModule } from './orgs/orgs.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ClassSchedulesModule } from './class-schedules/class-schedules.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { StudentsModule } from './students/students.module';
import { AdmissionsModule } from './admissions/admissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrgsModule,
    BranchesModule,
    ClassSchedulesModule,
    DashboardModule,
    AttendanceModule,
    StudentsModule,
    AdmissionsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
