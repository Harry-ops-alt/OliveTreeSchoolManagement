import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

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
  list(@Query() query: ListSubscriptionsDto) {
    return this.subscriptionsService.list(query);
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
    return this.subscriptionsService.getById(id);
  }

  @Post()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.FINANCE_MANAGER,
    Role.ADMISSIONS_OFFICER,
  )
  @Capabilities('finance:manage')
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.subscriptionsService.cancel(id, reason);
  }
}
