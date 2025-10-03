import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@prisma/client';
import { REQUEST_USER_KEY } from '../auth.constants.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import {
  hasAnyCapability,
  Capability,
} from '../roles.constants.js';
import { CAPABILITIES_KEY } from '../decorators/capabilities.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<User['role'][]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredCapabilities = this.reflector.getAllAndOverride<Capability[]>(
      CAPABILITIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request[REQUEST_USER_KEY] as { role?: User['role'] } | undefined;

    if (!user?.role) {
      throw new ForbiddenException('User role not found on request');
    }

    if (requiredCapabilities?.length) {
      const allowedByCapability = hasAnyCapability(user.role, requiredCapabilities);
      if (!allowedByCapability) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
