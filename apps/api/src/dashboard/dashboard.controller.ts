import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { SessionUserData } from '../users/users.service';

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
