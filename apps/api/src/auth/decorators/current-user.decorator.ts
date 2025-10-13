import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SessionUserData } from '../../users/users.service';
import { REQUEST_USER_KEY } from '../auth.constants';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUserData => {
    const request = context.switchToHttp().getRequest();
    return request[REQUEST_USER_KEY];
  },
);
