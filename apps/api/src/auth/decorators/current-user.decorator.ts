import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionUserData } from '../../users/users.service.js';
import { REQUEST_USER_KEY } from '../auth.constants.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUserData => {
    const request = context.switchToHttp().getRequest();
    return request[REQUEST_USER_KEY];
  },
);
