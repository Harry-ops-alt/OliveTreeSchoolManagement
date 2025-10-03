import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { SessionUserData } from '../users/users.service.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: SessionUserData) {
    return this.dashboardService.getSummary(user);
  }

  @Get('admissions/recent')
  async getRecentAdmissions(@CurrentUser() user: SessionUserData) {
    return this.dashboardService.getRecentAdmissions(user);
  }

  @Get('finance/recent')
  async getRecentFinance(@CurrentUser() user: SessionUserData) {
    return this.dashboardService.getRecentFinance(user);
  }
}
