import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { ListFeeStructuresDto } from './dto/list-fee-structures.dto';

@Controller('fee-structures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) {}

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.FINANCE_MANAGER,
    Role.FINANCE_OFFICER,
    Role.ADMISSIONS_OFFICER,
  )
  @Capabilities('finance:view')
  list(@Query() query: ListFeeStructuresDto) {
    return this.feeStructuresService.list(query);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.OPERATIONS_MANAGER,
    Role.BRANCH_MANAGER,
    Role.FINANCE_MANAGER,
    Role.FINANCE_OFFICER,
    Role.ADMISSIONS_OFFICER,
  )
  @Capabilities('finance:view')
  get(@Param('id') id: string) {
    return this.feeStructuresService.getById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  create(@Body() dto: CreateFeeStructureDto) {
    return this.feeStructuresService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  update(@Param('id') id: string, @Body() dto: UpdateFeeStructureDto) {
    return this.feeStructuresService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  archive(@Param('id') id: string) {
    return this.feeStructuresService.archive(id);
  }
}
