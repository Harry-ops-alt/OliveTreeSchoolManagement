import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrgsModule } from './orgs/orgs.module';
import { BranchesModule } from './branches/branches.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClassSchedulesModule } from './class-schedules/class-schedules.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { TeachersModule } from './teachers/teachers.module';
import { FeeStructuresModule } from './fee-structures/fee-structures.module';

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
    ClassesModule,
    StudentsModule,
    TeachersModule,
    FeeStructuresModule,
    AdmissionsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
