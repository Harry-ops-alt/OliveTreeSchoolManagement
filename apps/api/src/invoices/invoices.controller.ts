import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Capabilities } from '../auth/decorators/capabilities.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.FINANCE_MANAGER,
    Role.FINANCE_OFFICER,
    Role.BRANCH_MANAGER,
  )
  @Capabilities('finance:view')
  list(@Query() query: ListInvoicesDto) {
    return this.invoicesService.list(query);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SCHOOL_ADMIN,
    Role.FINANCE_MANAGER,
    Role.FINANCE_OFFICER,
    Role.BRANCH_MANAGER,
  )
  @Capabilities('finance:view')
  get(@Param('id') id: string) {
    return this.invoicesService.getById(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Post('generate-from-subscription')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  generateFromSubscription(
    @Body('subscriptionId') subscriptionId: string,
    @Body('periodStart') periodStart: string,
    @Body('periodEnd') periodEnd: string,
  ) {
    return this.invoicesService.generateFromSubscription(
      subscriptionId,
      new Date(periodStart),
      new Date(periodEnd),
    );
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }

  @Post('mark-overdue')
  @Roles(Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.FINANCE_MANAGER)
  @Capabilities('finance:manage')
  markOverdue() {
    return this.invoicesService.markOverdue();
  }
}
