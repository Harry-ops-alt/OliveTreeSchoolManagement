import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { REQUEST_USER_KEY } from '../auth.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(
    err: unknown,
    user: unknown,
    info: unknown,
    context: ExecutionContext,
  ) {
    const request = context.switchToHttp().getRequest();
    request[REQUEST_USER_KEY] = user;
    return super.handleRequest(err, user, info, context);
  }
}
