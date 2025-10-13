import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { PaymentPlansService } from './payment-plans.service';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';

@Controller('payment-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentPlansController {
  constructor(private readonly paymentPlansService: PaymentPlansService) {}

  @Get('invoice/:invoiceId')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER, Role.FINANCE_OFFICER)
  @Capabilities('finance:view')
  getByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.paymentPlansService.getByInvoice(invoiceId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  create(@Body() dto: CreatePaymentPlanDto) {
    return this.paymentPlansService.create(dto);
  }

  @Post(':id/installments/:index/mark-paid')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  markInstallmentPaid(@Param('id') id: string, @Param('index') index: string) {
    return this.paymentPlansService.markInstallmentPaid(id, parseInt(index, 10));
  }
}
