import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AuthTokenPayload } from '../auth.types';
import { AUTH_TOKEN_COOKIE_NAME } from '../auth.constants';

const parseCookieHeader = (cookieHeader?: string | string[]): Record<string, string> | null => {
  if (!cookieHeader) {
    return null;
  }

  const headerValue = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader;
  if (!headerValue.trim()) {
    return null;
  }

  const pairs = headerValue.split(';');
  const cookies: Record<string, string> = {};

  for (const pair of pairs) {
    const [rawName, ...rest] = pair.split('=');
    if (!rawName) {
      continue;
    }
    const name = rawName.trim();
    if (!name) {
      continue;
    }
    const rawValue = rest.join('=').trim();
    cookies[name] = decodeURIComponent(rawValue ?? '');
  }

  return cookies;
};

const cookieExtractor = (req: Request | undefined): string | null => {
  if (!req) {
    return null;
  }

  const requestWithCookies = req as Request & { cookies?: Record<string, string> };
  const parsedCookies = requestWithCookies.cookies ?? parseCookieHeader(req.headers?.cookie);

  if (!parsedCookies) {
    return null;
  }

  return parsedCookies[AUTH_TOKEN_COOKIE_NAME] ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: AuthTokenPayload) {
    return payload;
  }
}
