import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';

@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:view')
  list(@Query('organizationId') organizationId: string, @Query('active') active?: string) {
    return this.discountsService.list(organizationId, active === 'true');
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:view')
  get(@Param('id') id: string) {
    return this.discountsService.getById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.create(dto);
  }

  @Post('validate')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER, Role.ADMISSIONS_OFFICER)
  @Capabilities('finance:view')
  validate(@Body('code') code: string, @Body('studentId') studentId: string) {
    return this.discountsService.validate(code, studentId);
  }
}
