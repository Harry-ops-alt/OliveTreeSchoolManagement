import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClassSchedulesService } from './class-schedules.service';
import { ClassSchedulesController } from './class-schedules.controller';

@Module({
  imports: [PrismaModule],
  providers: [ClassSchedulesService],
  controllers: [ClassSchedulesController],
  exports: [ClassSchedulesService],
})
export class ClassSchedulesModule {}
