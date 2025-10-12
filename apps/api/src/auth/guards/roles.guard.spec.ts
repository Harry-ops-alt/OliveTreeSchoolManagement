import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CAPABILITIES_KEY } from '../decorators/capabilities.decorator';
import { REQUEST_USER_KEY } from '../auth.constants';
import { AdmissionsCapability, SisCapability } from '../roles.constants';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  let getAllAndOverrideSpy: jest.SpyInstance;
  let guard: RolesGuard;

  beforeEach(() => {
    getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride');
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const createContext = (role?: Role): ExecutionContext => {
    const handler = jest.fn();
    const cls = jest.fn();

    return {
      switchToHttp: () => ({
        getRequest: () => ({
          [REQUEST_USER_KEY]: { role },
        }),
      }),
      getHandler: handler,
      getClass: cls,
    } as unknown as ExecutionContext;
  };

  it('allows access when user has required capability', () => {
    const context = createContext(Role.BRANCH_MANAGER);

    getAllAndOverrideSpy.mockImplementation((metadataKey: string) => {
      if (metadataKey === ROLES_KEY) {
        return undefined;
      }
      if (metadataKey === CAPABILITIES_KEY) {
        return [SisCapability.ViewBranches];
      }
      return undefined;
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when user has required role and capability', () => {
    const context = createContext(Role.SUPER_ADMIN);

    getAllAndOverrideSpy.mockImplementation((metadataKey: string) => {
      if (metadataKey === ROLES_KEY) {
        return [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN];
      }
      if (metadataKey === CAPABILITIES_KEY) {
        return [AdmissionsCapability.ManageApplications];
      }
      return undefined;
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws when user lacks required capability', () => {
    const context = createContext(Role.BRANCH_MANAGER);

    getAllAndOverrideSpy.mockImplementation((metadataKey: string) => {
      if (metadataKey === ROLES_KEY) {
        return undefined;
      }
      if (metadataKey === CAPABILITIES_KEY) {
        return ['finance:manage'];
      }
      return undefined;
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws when user lacks required role', () => {
    const context = createContext(Role.BRANCH_MANAGER);

    getAllAndOverrideSpy.mockImplementation((metadataKey: string) => {
      if (metadataKey === ROLES_KEY) {
        return [Role.SUPER_ADMIN];
      }
      if (metadataKey === CAPABILITIES_KEY) {
        return undefined;
      }
      return undefined;
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
