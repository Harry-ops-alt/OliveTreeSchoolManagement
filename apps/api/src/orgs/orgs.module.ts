import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrgsService } from './orgs.service.js';
import { OrgsController } from './orgs.controller.js';

@Module({
  imports: [PrismaModule],
  providers: [OrgsService],
  controllers: [OrgsController],
  exports: [OrgsService],
})
export class OrgsModule {}
