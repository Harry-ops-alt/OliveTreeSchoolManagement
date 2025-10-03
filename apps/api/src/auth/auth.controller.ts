import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { SessionUserData } from '../users/users.service.js';
import type { AuthResponse } from './auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() { email, password }: LoginDto): Promise<AuthResponse> {
    return this.authService.login(email, password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: SessionUserData): Promise<SessionUserData> {
    return this.authService.profile(user);
  }
}
