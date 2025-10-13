import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SessionUserData } from '../users/users.service';
import { PaymentsService } from './payments.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.FINANCE_MANAGER,
    Role.FINANCE_OFFICER,
  )
  @Capabilities('finance:view')
  list(@Query() query: ListPaymentsDto) {
    return this.paymentsService.list(query);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.FINANCE_MANAGER,
    Role.FINANCE_OFFICER,
  )
  @Capabilities('finance:view')
  get(@Param('id') id: string) {
    return this.paymentsService.getById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER, Role.FINANCE_OFFICER)
  @Capabilities('payments:process')
  recordPayment(@CurrentUser() user: SessionUserData, @Body() dto: RecordPaymentDto) {
    return this.paymentsService.recordPayment(dto, user.id);
  }

  @Post(':id/refund')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  refund(
    @CurrentUser() user: SessionUserData,
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
  ) {
    return this.paymentsService.refund(id, amount, reason, user.id);
  }
}
