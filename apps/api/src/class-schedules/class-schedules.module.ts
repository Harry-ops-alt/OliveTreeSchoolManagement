import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ClassSchedulesService } from './class-schedules.service.js';
import { ClassSchedulesController } from './class-schedules.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [ClassSchedulesService],
  controllers: [ClassSchedulesController],
  exports: [ClassSchedulesService],
})
export class ClassSchedulesModule {}
