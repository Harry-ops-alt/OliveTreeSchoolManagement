import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdmissionsService } from './admissions.service.js';
import { AdmissionsController } from './admissions.controller.js';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AdmissionsService],
  controllers: [AdmissionsController],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
