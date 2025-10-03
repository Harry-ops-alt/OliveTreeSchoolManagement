import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { UsersService } from '../users/users.service.js';
import type { SessionUserData } from '../users/users.service.js';
import type { AuthResponse, AuthTokenPayload } from './auth.types.js';

@Injectable()
export class AuthService {
  private readonly jwtTTLSeconds: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwtTTLSeconds = configService.get<number>('JWT_TTL_SECONDS', 900);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<SessionUserData> {
    const user = await this.usersService.findByEmailRaw(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await verify(user.passwordHash, password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.usersService.toSessionUser(user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const sessionUser = await this.validateUser(email, password);

    const payload: AuthTokenPayload = {
      sub: sessionUser.id,
      ...sessionUser,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.jwtTTLSeconds,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtTTLSeconds,
      user: sessionUser,
    };
  }

  async profile(user: SessionUserData): Promise<SessionUserData> {
    const fullUser = await this.usersService.findByIdRaw(user.id);
    if (!fullUser) {
      throw new NotFoundException('User not found');
    }
    return this.usersService.toSessionUser(fullUser);
  }
}
